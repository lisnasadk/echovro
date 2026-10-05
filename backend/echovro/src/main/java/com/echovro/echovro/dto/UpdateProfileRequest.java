package com.echovro.echovro.dto;

import java.util.List;

public class UpdateProfileRequest {
    private String gender;
    private String avatar;
    private MusicInfo music;
    private List<List<String>> tracks;
    private MusicPreferencesDto preferences;

    public static class MusicInfo {
        private String service;
        private String code;

        public MusicInfo() {}

        public String getService() {
            return service;
        }

        public void setService(String service) {
            this.service = service;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
    }

    public UpdateProfileRequest() {}

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

    public MusicInfo getMusic() {
        return music;
    }

    public void setMusic(MusicInfo music) {
        this.music = music;
    }

    public List<List<String>> getTracks() {
        return tracks;
    }

    public void setTracks(List<List<String>> tracks) {
        this.tracks = tracks;
    }

    public MusicPreferencesDto getPreferences() {
        return preferences;
    }

    public void setPreferences(MusicPreferencesDto preferences) {
        this.preferences = preferences;
    }
}
