package com.echovro.echovro.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MusicProfileDto {
    private Map<String, Double> genreVec = new HashMap<>();
    private List<String> topGenres = new ArrayList<>();
    private List<String> topArtists = new ArrayList<>();
    private List<String> languages = new ArrayList<>();
    private double diversity;
    private int dataCount;
    private boolean hasData;
    private String service;

    public MusicProfileDto() {}

    public Map<String, Double> getGenreVec() {
        return genreVec;
    }

    public void setGenreVec(Map<String, Double> genreVec) {
        this.genreVec = genreVec != null ? genreVec : new HashMap<>();
    }

    public List<String> getTopGenres() {
        return topGenres;
    }

    public void setTopGenres(List<String> topGenres) {
        this.topGenres = topGenres != null ? topGenres : new ArrayList<>();
    }

    public List<String> getTopArtists() {
        return topArtists;
    }

    public void setTopArtists(List<String> topArtists) {
        this.topArtists = topArtists != null ? topArtists : new ArrayList<>();
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages != null ? languages : new ArrayList<>();
    }

    public double getDiversity() {
        return diversity;
    }

    public void setDiversity(double diversity) {
        this.diversity = diversity;
    }

    public int getDataCount() {
        return dataCount;
    }

    public void setDataCount(int dataCount) {
        this.dataCount = dataCount;
    }

    public boolean isHasData() {
        return hasData;
    }

    public void setHasData(boolean hasData) {
        this.hasData = hasData;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }
}
