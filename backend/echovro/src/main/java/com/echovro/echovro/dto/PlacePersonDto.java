package com.echovro.echovro.dto;

import java.util.List;

public class PlacePersonDto {
    private String u;   // username
    private String av;  // avatar id
    private String s;   // song title
    private String m;   // music service
    private List<List<String>> t; // tracks [[title, artist], ...]

    public PlacePersonDto() {}

    public PlacePersonDto(String u, String av, String s, String m, List<List<String>> t) {
        this.u = u;
        this.av = av;
        this.s = s;
        this.m = m;
        this.t = t;
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
}
