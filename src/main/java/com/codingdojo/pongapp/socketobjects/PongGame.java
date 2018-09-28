package com.codingdojo.pongapp.socketobjects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.ArrayList;

public class PongGame implements Runnable{
    @Autowired
    private SimpMessagingTemplate template;
    private Ball b;
    private kevinPaddle leftPaddle;
    private kevinPaddle rightPaddle;
    private String leftUser = null;
    private String rightUser = null;
    private ArrayList<String> spectators;
    private Boolean[] allArray = {false, false, false, false};
    private long id;
    public PongGame(long _id) {
        System.out.println("creating pong G-MAE");
        leftPaddle = new kevinPaddle((float)-15, (float)0, (float)0.95);
        rightPaddle = new kevinPaddle((float)15, (float)0, (float)0.95);
        b = new Ball(0,0, leftPaddle, rightPaddle);
        spectators = new ArrayList<>();
        this.id = _id;
    }
    public long getId() {return id;}
    public void addUser(String user){
        System.out.println("Adding user");
        try {
            if (user.equals(leftUser)) {return;}
            if (user.equals(rightUser)) {return;}
            if(leftUser == null){
                leftUser = user;
            } else if(rightUser == null){
                rightUser = user;
                Thread t = new Thread(this);
                t.run();
            }else{
                spectators.add(user);
            }
        } finally {
            System.out.println("Left User "+leftUser+" Right User "+rightUser);
        }
    }

    public String getStatus() {
        String temp = "{ \"left\": { \"x_position\": "+ leftPaddle.x_center +", \"y_position\": "+ leftPaddle.y_center +", \"speed\": "+ leftPaddle.vy +", \"friction\": "+leftPaddle.friction+"}, \"right\": { \"x_position\": "+ rightPaddle.x_center +", \"y_position\": "+ rightPaddle.y_center +", \"speed\": "+ rightPaddle.vy +", \"friction\": "+rightPaddle.friction+"}, \"ball\":{ \"x_position\": "+ b.x +", \"y_position\": "+ b.y +", \"x_speed\": "+ b.vx +", \"y_speed\":"+ b.vy +"}}";
        return temp;
    }

    //Set movement top and bottom of each of the paddle's
    //We get the username from the principal and since we're going to make username's 
    //unique we will only have one possible client sending them.
    //We will only set the movement top or bottom to false after the server tick is over
    public void handleKeyEvent(ClientKeyEventMessage kem, String username) {
        if(username.equals(leftUser)){
            allArray[0] = allArray[0] || kem.getBottom();
            allArray[1] = allArray[1] || kem.getTop();
        }else if(username.equals(rightUser)){
            allArray[2] = allArray[2] || kem.getBottom();
            allArray[3] = allArray[3] || kem.getTop();
        }
    }

    public PongGame runGame(int serverTic){
        Boolean[] tempArrayLeft = {allArray[0], allArray[1]};
        Boolean[] tempArrayRight = {allArray[2], allArray[3]};
        leftPaddle.movement(tempArrayLeft, ((float)serverTic)/1000);
        rightPaddle.movement(tempArrayRight, ((float)serverTic)/1000);
        b.move(((float)serverTic)/1000);
        allArray = new Boolean[]{false, false, false, false};
        return this;
    }
    @Override
    public void run() {
        runHelper(System.currentTimeMillis());
    }
    private void runHelper(long previousTime) {
        long next_time = System.currentTimeMillis();
        long this_time = System.currentTimeMillis();
        try {
            runGame((int)(this_time-previousTime));
            this.template.convertAndSend("/topic/game/"+getId(), this);
        }catch (Exception e){System.out.print(e);}
        long x = System.currentTimeMillis() - previousTime;
        if (x < 30) {
            try {
                Thread.sleep(30 - x);
            } catch (InterruptedException e) {
//                e.printStackTrace();
            }
        }
//        runHelper(next_time);
    }
}