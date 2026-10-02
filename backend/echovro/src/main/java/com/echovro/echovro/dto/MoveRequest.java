package com.echovro.echovro.dto;

public class MoveRequest {
    private String username;
    private Double px, py, pz, ry;
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Double getPx() { return px; }
    public void setPx(Double px) { this.px = px; }
    public Double getPy() { return py; }
    public void setPy(Double py) { this.py = py; }
    public Double getPz() { return pz; }
    public void setPz(Double pz) { this.pz = pz; }
    public Double getRy() { return ry; }
    public void setRy(Double ry) { this.ry = ry; }
}