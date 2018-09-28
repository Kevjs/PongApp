var scene, camera, directionalLight, renderer, bg_light, point_light;
var left_paddle_geo, white_material, left_paddle;
var right_paddle_geo, right_paddle;
var background_geo, wall_mesh, background_wall;
var ball_geo, ball_mesh, ball, ball_vx, ball_vy;
var frame_geo, frame_mesh, middle_line;
var t, previous_t, dt;
var mouse;
var left_up, left_down, right_up, right_down;
var gridHelper;
var left_paddle_mouse_grabber;
var arr_mouse_grabber;
var paused = false;
var topM = false, bottom = false;
var stompClient = null;
var myAudio = new Audio();

var paddle_velY = 0,
    paddle_velX = 0,
    speed = .5,
    accel = .02,
    friction = .95,
    keys = [];

function init(callback) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, .1, 1000 );
    directionalLight = new THREE.DirectionalLight( 0xffffff, 10 );
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.querySelector("#canvas_container").appendChild( renderer.domElement );

    camera.position.set( 0, 0, 12);
    camera.lookAt( 0, 0, 0);
    bg_light = new THREE.AmbientLight( 0x404040, 2 ); // soft white light
    scene.add( bg_light);
    point_light = new THREE.PointLight(0x666666, 3, 0);
    point_light.translateZ(-10);
    scene.add(point_light);

    left_paddle_geo = new THREE.BoxGeometry( 0.5, 4, 1 );

    // Texture wrapping for left paddle
    let paddleTexture = new THREE.TextureLoader().load("/img/wood_texture2.jpg");
    paddleTexture.minFilter = THREE.LinearFilter;
    white_material = new THREE.MeshStandardMaterial( { color: 0xffffff } );
    left_paddle = new THREE.Mesh(left_paddle_geo, new THREE.MeshPhongMaterial({color:0xffffff, map:paddleTexture}));
    left_paddle.translateX(-15);
    scene.add(left_paddle);

    left_paddle_mouse_grabber_geo = new THREE.BoxGeometry(4,12,0.8);
    left_paddle_mouse_grabber_material = new THREE.MeshBasicMaterial({
        color: 0x248f24, alphaTest: 0, visible: false});
    left_paddle_mouse_grabber = new THREE.Mesh(
        left_paddle_mouse_grabber_geo,left_paddle_mouse_grabber_material);
    left_paddle_mouse_grabber.translateX(-10);
    // left_paddle_mouse_grabber.translateY(+2);
    scene.add(left_paddle_mouse_grabber);

    let paddleTexture2 = new THREE.TextureLoader().load("/img/wood_texture3.jpg");
    paddleTexture2.minFilter = THREE.LinearFilter;
    right_paddle_geo= new THREE.BoxGeometry( 0.5, 4, 1 );
    right_paddle = new THREE.Mesh(right_paddle_geo, new THREE.MeshPhongMaterial({color:0xffffff, map:paddleTexture2}));
    right_paddle.translateX(15);
    right_paddle.translateY(-3);
    scene.add(right_paddle);

    // Creation of background geometry
    var texture, material;
    texture = new THREE.TextureLoader().load("/img/universe1.jpg")
    texture.minFilter = THREE.LinearFilter;
    material = new THREE.MeshBasicMaterial({ map : texture });
    background_geo = new THREE.BoxGeometry(60, 30, 1);
    background_wall = new THREE.Mesh(background_geo, material);
    background_wall.translateZ(-5);
    scene.add(background_wall);

    ball_geo = new THREE.SphereGeometry(0.4);
    ball_mesh = new THREE.MeshStandardMaterial({color:0xff0000});
    ball = new THREE.Mesh(ball_geo, ball_mesh);
    scene.add(ball);
    ball_vx = 4;
    ball_vy = 0;

    // Center line
    midline_geo= new THREE.BoxGeometry(.2, 30, -1);
    middle_line = new THREE.Mesh(midline_geo, white_material);
    middle_line.translateZ(-1);
    scene.add(middle_line);
    
    t = 0;
    left_up = false; left_down = false; right_up = false; right_down = false;
    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    connect(callback);
    
}

function connect(callback){
    var socket = new SockJS("/ourGame");
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame){
        // console.log('Here Connected: ' + frame);
        stompClient.subscribe("/topic/thisGame", function (movement){
            computerMove(movement);
        });
        callback();
    });
}

function onDocumentMouseMove(event) {
    mouse.x = ( (event.clientX) / (window.innerWidth) ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(left_paddle_mouse_grabber);
    if (intersects.length > 0) {
        left_paddle.position.y = intersects[0].point.y;
    }
}
function collide() {
	//Checking both paddles, could be limited with direction of ball velocity
	//Could also be checked if the ball is close to the a paddle
    paddleCollision(left_paddle, ball, "left");
    paddleCollision(right_paddle, ball, "right");
    
    var next_y = ball.position.y + ball_vy;
    if (8 < next_y || next_y < -8) {
        ball_vy *= -1;
    }
}

//Checks if the paddle passed in is in collision with the ball. Only detect collision once per side to avoid ball being hit multiple times
var leftPlayerHit, rightPlayerHit
var count = 0;
function paddleCollision(paddle, ball, player){
    let p = new THREE.Box3().setFromObject(paddle);
    // p.expandByVector(new THREE.Vector3(10,0,0)); 
	let b = new THREE.Box3().setFromObject(ball);
    let col = b.intersectsBox(p);
    
    if(player == "left"){
        if(col && !leftPlayerHit){
            leftPlayerHit = true;
            rightPlayerHit = false;
            playSoundOnce('/sound/dding.mp3');
            let hitPoint = new THREE.Vector3((b.intersect(p).max.x + b.intersect(p).min.x)*.5, (b.intersect(p).max.y + b.intersect(p).min.y)*.5, (b.intersect(p).max.z + b.intersect(p).min.z)*.5);
            let distanceFromCenter = hitPoint.y - paddle.position.y;
            ball_vx*=-1;
            if(Math.abs(ball_vx) < 28){
                ball_vx *= 1.05;
            }
            ball_vy = 0.2*distanceFromCenter;
            count++;
        }
    }
    if(player == "right"){
        if(col && !rightPlayerHit){
            rightPlayerHit = true;
            leftPlayerHit = false;
            playSoundOnce('/sound/ddingother.mp3');
            let hitPoint = new THREE.Vector3((b.intersect(p).max.x + b.intersect(p).min.x)*.5, (b.intersect(p).max.y + b.intersect(p).min.y)*.5, (b.intersect(p).max.z + b.intersect(p).min.z)*.5);
            let distanceFromCenter = hitPoint.y - paddle.position.y;
            ball_vx*=-1;
            if(Math.abs(ball_vx) < 28){
                ball_vx *= 1.05;
            }
            ball_vy = 0.2*distanceFromCenter;
            count++;
        }
    }
}

var runOnce;
function deathMatch(){
    if (ball_vx > 20 && !runOnce){
        runOnce = true;
        sound('/sound/deathmatch.wav');
    }
}
function returnBall() {
    ball.position.x = 0;
    ball.position.y = 0;
    playSoundOnce('/sound/out.mp3');
}
function pauseGame() {
    paused = true;
    document.querySelector("#pause-anchor").style.display = "none";
    document.querySelector("#resume-anchor").style.display = "inline";
}
function resumeGame() {
    paused = false;
    document.querySelector("#pause-anchor").style.display = "inline";
    document.querySelector("#resume-anchor").style.display = "none";
    animate();
}

function computerMove(movement) {
    movement = JSON.parse(movement["body"]);

    // console.log(movement);

    if (movement["top"]) {
        if (paddle_velY > -speed) {
            paddle_velY += accel;
        }
    }

    if (movement["bottom"]) {
        if (paddle_velY < speed) {
            paddle_velY -= accel;
        }
    }

    // Paddle movement and position constraint
    paddle_velY *= friction;
    if(paddle_velY > 0){
        if(left_paddle.position.y <= 8){
            left_paddle.translateY(paddle_velY);
        }
    }else{
        if(left_paddle.position.y >= -8){
            left_paddle.translateY(paddle_velY);
        }
    }
}
function update() {
    t = performance.now()/1000;
    deathMatch();
    collide();
    let tempMovement = {"top":topM+"", "bottom":bottom};
    stompClient.send("/app/myMovements", {}, JSON.stringify(tempMovement));


    ball.translateX(0.05*ball_vx);
    ball.translateY(ball_vy);
    if (Math.abs(ball.position.x)>20) {
        ball_vx = 4;
        ball_vy = 0;
        leftPlayerHit = false;
        rightPlayerHit = false;
        runOnce = false;
        returnBall();
        pauseGame();
    }
    right_paddle.position.y = ball.position.y;
}

document.body.addEventListener("keydown", function (e) {
    if(e.keyCode === 38) topM = true;
    if(e.keyCode === 40) bottom = true;

    if(e.keyCode === 32 && paused){
        resumeGame();
    }
});
document.body.addEventListener("keyup", function (e) {
    if(e.keyCode === 38) topM = false;
    if(e.keyCode === 40) bottom = false;
});

function animate() {
    update();
    if (paused) {return;}
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
function sound(path) {
    myAudio.src = path;
    myAudio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
    }, false);

    myAudio.play();
}
function playSoundOnce(path) {
    bgSound = new Audio(path);
    bgSound.play(); 
}
init(animate);