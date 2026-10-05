package com.echovro.echovro.dto;

public class MoveRequest {
    private String user;
    private Double px;
    private Double py;
    private Double pz;
    private Double ry;
    private boolean moving;
    private boolean sit;

    public MoveRequest() {}

    public MoveRequest(String user, Double px, Double py, Double pz, Double ry, boolean moving, boolean sit) {
        this.user = user;
        this.px = px;
        this.py = py;
        this.pz = pz;
        this.ry = ry;
        this.moving = moving;
        this.sit = sit;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public Double getPx() {
        return px;
    }

    public void setPx(Double px) {
        this.px = px;
    }

    public Double getPy() {
        return py;
    }

    public void setPy(Double py) {
        this.py = py;
    }

    public Double getPz() {
        return pz;
    }

    public void setPz(Double pz) {
        this.pz = pz;
    }

    public Double getRy() {
        return ry;
    }

    public void setRy(Double ry) {
        this.ry = ry;
    }

    public boolean isMoving() {
        return moving;
    }

    public void setMoving(boolean moving) {
        this.moving = moving;
    }

    public boolean isSit() {
        return sit;
    }

    public void setSit(boolean sit) {
        this.sit = sit;
    }
}
