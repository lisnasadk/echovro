package com.echovro.echovro.dto;

public class SetSongRequest {
    private String place;
    private String username;
    private String song;

    public SetSongRequest() {}

    public String getPlace() {
        return place;
    }

    public void setPlace(String place) {
        this.place = place;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getSong() {
        return song;
    }

    public void setSong(String song) {
        this.song = song;
    }
}
