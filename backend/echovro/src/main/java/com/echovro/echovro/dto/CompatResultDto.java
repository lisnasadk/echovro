package com.echovro.echovro.dto;

import java.util.ArrayList;
import java.util.List;

public class CompatResultDto {
    private Integer score;
    private String label;
    private boolean insufficientData;
    private List<String> shared = new ArrayList<>();
    private List<String> myTop = new ArrayList<>();
    private List<String> theirTop = new ArrayList<>();
    private String bridge;
    private List<String> bridgeArtists = new ArrayList<>();

    public CompatResultDto() {}

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public boolean isInsufficientData() {
        return insufficientData;
    }

    public void setInsufficientData(boolean insufficientData) {
        this.insufficientData = insufficientData;
    }

    public List<String> getShared() {
        return shared;
    }

    public void setShared(List<String> shared) {
        this.shared = shared != null ? shared : new ArrayList<>();
    }

    public List<String> getMyTop() {
        return myTop;
    }

    public void setMyTop(List<String> myTop) {
        this.myTop = myTop != null ? myTop : new ArrayList<>();
    }

    public List<String> getTheirTop() {
        return theirTop;
    }

    public void setTheirTop(List<String> theirTop) {
        this.theirTop = theirTop != null ? theirTop : new ArrayList<>();
    }

    public String getBridge() {
        return bridge;
    }

    public void setBridge(String bridge) {
        this.bridge = bridge;
    }

    public List<String> getBridgeArtists() {
        return bridgeArtists;
    }

    public void setBridgeArtists(List<String> bridgeArtists) {
        this.bridgeArtists = bridgeArtists != null ? bridgeArtists : new ArrayList<>();
    }
}
