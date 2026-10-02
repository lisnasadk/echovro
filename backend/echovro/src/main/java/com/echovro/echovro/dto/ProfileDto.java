package com.echovro.echovro.dto;

import java.util.List;

public class ProfileDto {
    private Long id;
    private String name;
    private String email;
    private String gender;
    private String avatar;
    private String musicService;
    private String currentPlace;
    private String currentSong;
    private List<List<String>> tracks;

    public ProfileDto() {}

    public ProfileDto(Long id, String name, String email, String gender, String avatar, String musicService, String currentPlace, String currentSong, List<List<String>> tracks) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.gender = gender;
        this.avatar = avatar;
        this.musicService = musicService;
        this.currentPlace = currentPlace;
        this.currentSong = currentSong;
        this.tracks = tracks;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getMusicService() {
        return musicService;
    }

    public void setMusicService(String musicService) {
        this.musicService = musicService;
    }

    public String getCurrentPlace() {
        return currentPlace;
    }

    public void setCurrentPlace(String currentPlace) {
        this.currentPlace = currentPlace;
    }

    public String getCurrentSong() {
        return currentSong;
    }

    public void setCurrentSong(String currentSong) {
        this.currentSong = currentSong;
    }

    public List<List<String>> getTracks() {
        return tracks;
    }

    public void setTracks(List<List<String>> tracks) {
        this.tracks = tracks;
    }
}
