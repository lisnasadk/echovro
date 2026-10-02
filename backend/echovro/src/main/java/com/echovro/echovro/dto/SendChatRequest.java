package com.echovro.echovro.dto;

public class SendChatRequest {
    private String to;
    private String text;

    public SendChatRequest() {}

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
