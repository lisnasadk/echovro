package com.echovro.echovro.dto;

public class CompatRequestDto {
    private String targetUsername;

    public CompatRequestDto() {}

    public CompatRequestDto(String targetUsername) {
        this.targetUsername = targetUsername;
    }

    public String getTargetUsername() {
        return targetUsername;
    }

    public void setTargetUsername(String targetUsername) {
        this.targetUsername = targetUsername;
    }
}
