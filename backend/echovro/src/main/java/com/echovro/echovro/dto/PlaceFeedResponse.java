package com.echovro.echovro.dto;

import java.util.ArrayList;
import java.util.List;

public class PlaceFeedResponse {
    private List<PlacePersonDto> people = new ArrayList<>();
    private List<List<String>> songs = new ArrayList<>();

    public PlaceFeedResponse() {}

    public PlaceFeedResponse(List<PlacePersonDto> people, List<List<String>> songs) {
        this.people = people;
        this.songs = songs;
    }

    public List<PlacePersonDto> getPeople() {
        return people;
    }

    public void setPeople(List<PlacePersonDto> people) {
        this.people = people;
    }

    public List<List<String>> getSongs() {
        return songs;
    }

    public void setSongs(List<List<String>> songs) {
        this.songs = songs;
    }
}
