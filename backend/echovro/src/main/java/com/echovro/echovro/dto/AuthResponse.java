package com.echovro.echovro.dto;

public class AuthResponse {

    private Long id;
    private String name;
    private String email;
    private String token;
    private String gender;
    private String avatar;

    public AuthResponse() {
    }

    public AuthResponse(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public AuthResponse(Long id, String name, String email, String token) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.token = token;
    }

    public AuthResponse(Long id, String name, String email, String token, String gender, String avatar) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.token = token;
        this.gender = gender;
        this.avatar = avatar;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
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
}