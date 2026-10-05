package com.echovro.echovro.dto;

import java.util.ArrayList;
import java.util.List;

public class MusicPreferencesDto {
    private List<String> genres = new ArrayList<>();
    private List<String> artists = new ArrayList<>();
    private List<String> languages = new ArrayList<>();

    public MusicPreferencesDto() {}

    public MusicPreferencesDto(List<String> genres, List<String> artists, List<String> languages) {
        this.genres = genres != null ? genres : new ArrayList<>();
        this.artists = artists != null ? artists : new ArrayList<>();
        this.languages = languages != null ? languages : new ArrayList<>();
    }

    public List<String> getGenres() {
        return genres;
    }

    public void setGenres(List<String> genres) {
        this.genres = genres != null ? genres : new ArrayList<>();
    }

    public List<String> getArtists() {
        return artists;
    }

    public void setArtists(List<String> artists) {
        this.artists = artists != null ? artists : new ArrayList<>();
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages != null ? languages : new ArrayList<>();
    }
}
