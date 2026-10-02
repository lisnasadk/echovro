package com.echovro.echovro.service;

import com.echovro.echovro.dto.PlaceFeedResponse;
import com.echovro.echovro.dto.PlacePersonDto;
import com.echovro.echovro.model.User;
import com.echovro.echovro.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PlaceService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PlaceService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PlaceFeedResponse getFeed(String placeKey, String currentUsername) {
        List<PlacePersonDto> people = new ArrayList<>();
        List<User> dbUsers = userRepository.findByCurrentPlace(placeKey);
        Set<String> seenUsernames = new HashSet<>();

        for (User u : dbUsers) {
            if (seenUsernames.contains(u.getName())) continue;
            seenUsernames.add(u.getName());

            List<List<String>> tracks = parseTracks(u.getTracksJson());
            if (tracks.isEmpty()) {
                tracks = new ArrayList<>(); // No mock tracks
            }

            people.add(new PlacePersonDto(
                    u.getName(),
                    u.getAvatar() != null ? u.getAvatar() : "m1",
                    u.getCurrentSong(), // No mock song
                    u.getMusicService() != null ? u.getMusicService() : "spotify",
                    tracks,
                    u.getPx(), u.getPy(), u.getPz(), u.getRy()
            ));
        }

        List<List<String>> songs = getSongsForPlace(placeKey);
        return new PlaceFeedResponse(people, songs);
    }

    @Transactional
    public void setSong(String placeKey, String username, String song) {
        if (username == null || username.isBlank()) return;
        Optional<User> uOpt = userRepository.findByName(username);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            u.setCurrentPlace(placeKey);
            u.setCurrentSong(song);
            u.setLastActive(LocalDateTime.now());
            userRepository.save(u);
        }
    }

    @Transactional
    public void joinPlace(String placeKey, String username) {
        if (username == null || username.isBlank()) return;
        Optional<User> uOpt = userRepository.findByName(username);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            u.setCurrentPlace(placeKey);
            u.setLastActive(LocalDateTime.now());
            userRepository.save(u);
        }
    }

    @Transactional
    public void leavePlace(String username) {
        if (username == null || username.isBlank()) return;
        Optional<User> uOpt = userRepository.findByName(username);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            u.setCurrentPlace(null);
            u.setLastActive(LocalDateTime.now());
            userRepository.save(u);
        }
    }

    @Transactional
    public void movePlace(String username, Double px, Double py, Double pz, Double ry) {
        if (username == null || username.isBlank()) return;
        Optional<User> uOpt = userRepository.findByName(username);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            u.setPx(px);
            u.setPy(py);
            u.setPz(pz);
            u.setRy(ry);
            userRepository.save(u);
        }
    }

    private List<List<String>> parseTracks(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<List<String>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<List<String>> getSongsForPlace(String placeKey) {
        return new ArrayList<>();
    }
}
