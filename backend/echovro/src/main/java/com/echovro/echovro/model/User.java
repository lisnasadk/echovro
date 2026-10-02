package com.echovro.echovro.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String gender;

    private String avatar;

    private String musicService;

    private String musicCode;

    private String currentPlace;
    
    private Double px;
    private Double py;
    private Double pz;
    private Double ry;

    private String currentSong;

    @Column(length = 8192)
    private String tracksJson;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastActive = LocalDateTime.now();

    public User() {}

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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public String getMusicCode() {
        return musicCode;
    }

    public void setMusicCode(String musicCode) {
        this.musicCode = musicCode;
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

    public String getTracksJson() {
        return tracksJson;
    }

    public void setTracksJson(String tracksJson) {
        this.tracksJson = tracksJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastActive() {
        return lastActive;
    }

    public void setLastActive(LocalDateTime lastActive) {
        this.lastActive = lastActive;
    }
    
    public Double getPx() { return px; }
    public void setPx(Double px) { this.px = px; }
    public Double getPy() { return py; }
    public void setPy(Double py) { this.py = py; }
    public Double getPz() { return pz; }
    public void setPz(Double pz) { this.pz = pz; }
    public Double getRy() { return ry; }
    public void setRy(Double ry) { this.ry = ry; }
}