package com.echovro.echovro.dto;

public class PresenceEventDto {
    private String type; // "join", "leave", "song"
    private String user;
    private String avatar;
    private String song;
    private String service;
    private Double px;
    private Double py;
    private Double pz;
    private Double ry;

    public PresenceEventDto() {}

    public PresenceEventDto(String type, String user) {
        this.type = type;
        this.user = user;
    }

    public PresenceEventDto(String type, String user, String avatar, String song, String service) {
        this.type = type;
        this.user = user;
        this.avatar = avatar;
        this.song = song;
        this.service = service;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getSong() {
        return song;
    }

    public void setSong(String song) {
        this.song = song;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
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
}
