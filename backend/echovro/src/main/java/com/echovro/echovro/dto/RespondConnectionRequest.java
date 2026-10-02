package com.echovro.echovro.dto;

public class RespondConnectionRequest {
    private String to;
    private boolean accept;

    public RespondConnectionRequest() {}

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public boolean isAccept() {
        return accept;
    }

    public void setAccept(boolean accept) {
        this.accept = accept;
    }
}
