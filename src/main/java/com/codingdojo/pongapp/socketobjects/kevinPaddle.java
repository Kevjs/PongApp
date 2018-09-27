package com.codingdojo.pongapp.socketobjects;

public class kevinPaddle {
    final float MIN_Y;
    final float MAX_Y;
    float x_center = 0;
    float y_center = 0;
    float vy = 0;
    float friction = 1;

    kevinPaddle() {
        MIN_Y = -5;
        MAX_Y = 5;
    }

    public kevinPaddle(float x, float y, float friction) {
        this();
        this.x_center = x; this.y_center = y; this.friction = friction;
    }

    public float getX_center(){
        return this.x_center;
    }

    public void movement(Boolean[] upDown, float dt) {
        vy += (dt * (upDown[1] ? 1 : 0) - dt * (upDown[0] ? 1 : 0));
        y_center += vy * dt * friction;
        y_center = Math.min(y_center, MAX_Y);
        y_center = Math.max(MIN_Y, y_center);
        if(y_center == MAX_Y || y_center == MIN_Y){
            vy = 0;
        }
    }

    public String getStatus() {
        return "x = "+x_center+", y = "+y_center;
    }
}