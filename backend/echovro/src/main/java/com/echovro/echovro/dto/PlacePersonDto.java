package com.echovro.echovro.dto;

import java.util.List;

public class PlacePersonDto {
    private String u;   // username
    private String av;  // avatar id
    private String s;   // song title
    private String m;   // music service
    private List<List<String>> t; // tracks [[title, artist], ...]
    private Double px;
    private Double py;
    private Double pz;
    private Double ry;
    private MusicPreferencesDto preferences;
    private MusicProfileDto profile;

    public PlacePersonDto() {}

    public PlacePersonDto(String u, String av, String s, String m, List<List<String>> t) {
        this.u = u;
        this.av = av;
        this.s = s;
        this.m = m;
        this.t = t;
    }

    public PlacePersonDto(String u, String av, String s, String m, List<List<String>> t, Double px, Double py, Double pz, Double ry) {
        this.u = u;
        this.av = av;
        this.s = s;
        this.m = m;
        this.t = t;
        this.px = px;
        this.py = py;
        this.pz = pz;
        this.ry = ry;
    }

    public String getU() {
        return u;
    }

    public void setU(String u) {
        this.u = u;
    }

    public String getAv() {
        return av;
    }

    public void setAv(String av) {
        this.av = av;
    }

    public String getS() {
        return s;
    }

    public void setS(String s) {
        this.s = s;
    }

    public String getM() {
        return m;
    }

    public void setM(String m) {
        this.m = m;
    }

    public List<List<String>> getT() {
        return t;
    }

    public void setT(List<List<String>> t) {
        this.t = t;
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

    public MusicPreferencesDto getPreferences() {
        return preferences;
    }

    public void setPreferences(MusicPreferencesDto preferences) {
        this.preferences = preferences;
    }

    public MusicProfileDto getProfile() {
        return profile;
    }

    public void setProfile(MusicProfileDto profile) {
        this.profile = profile;
    }
}
