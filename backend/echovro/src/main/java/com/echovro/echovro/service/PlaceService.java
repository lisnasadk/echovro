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
        if (currentUsername != null && !currentUsername.isBlank()) {
            seenUsernames.add(currentUsername);
        }

        for (User u : dbUsers) {
            if (seenUsernames.contains(u.getName())) continue;
            seenUsernames.add(u.getName());

            List<List<String>> tracks = parseTracks(u.getTracksJson());
            if (tracks.isEmpty()) {
                tracks = new ArrayList<>(); // No mock tracks
            }

            people.add(new PlacePersonDto(
                    u.getName(),
                    u.getAvatar() != null ? u.getAvatar() : "male_avatar_1",
                    u.getCurrentSong(), // No mock song
                    u.getMusicService() != null ? u.getMusicService() : "spotify",
                    tracks
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

    private List<List<String>> parseTracks(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<List<String>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String getDefaultSongForPlace(String placeKey) {
        if ("city".equalsIgnoreCase(placeKey)) return "Starboy – The Weeknd";
        if ("cafe".equalsIgnoreCase(placeKey)) return "Coffee – beabadoobee";
        return "Space Song – Beach House";
    }

    private List<List<String>> getDefaultTracksForPlace(String placeKey) {
        if ("city".equalsIgnoreCase(placeKey)) {
            return List.of(
                    List.of("Starboy", "The Weeknd"),
                    List.of("Blinding Lights", "The Weeknd"),
                    List.of("Nightcall", "Kavinsky"),
                    List.of("Midnight City", "M83")
            );
        } else if ("cafe".equalsIgnoreCase(placeKey)) {
            return List.of(
                    List.of("Coffee", "beabadoobee"),
                    List.of("Death Bed", "Powfu"),
                    List.of("Sunday Best", "Surfaces"),
                    List.of("Banana Pancakes", "Jack Johnson")
            );
        } else {
            return List.of(
                    List.of("Space Song", "Beach House"),
                    List.of("Apocalypse", "Cigarettes After Sex"),
                    List.of("Chamber of Reflection", "Mac DeMarco"),
                    List.of("Resonance", "HOME")
            );
        }
    }

    public List<List<String>> getSongsForPlace(String placeKey) {
        return new ArrayList<>(); // No mock data
    }

    private List<PlacePersonDto> getCuratedPeopleForPlace(String placeKey) {
        List<PlacePersonDto> list = new ArrayList<>();
        if ("city".equalsIgnoreCase(placeKey)) {
            list.add(new PlacePersonDto("elena_v", "female_avatar_1", "Midnight City – M83", "spotify",
                    List.of(List.of("Midnight City", "M83"), List.of("Blinding Lights", "The Weeknd"), List.of("After Hours", "The Weeknd"))));
            list.add(new PlacePersonDto("kai.synth", "male_avatar_2", "Nightcall – Kavinsky", "ytm",
                    List.of(List.of("Nightcall", "Kavinsky"), List.of("Instant Crush", "Daft Punk"), List.of("Genesis", "Justice"))));
        } else if ("cafe".equalsIgnoreCase(placeKey)) {
            list.add(new PlacePersonDto("maya_acoustic", "female_avatar_2", "Coffee – beabadoobee", "spotify",
                    List.of(List.of("Coffee", "beabadoobee"), List.of("Sunday Best", "Surfaces"), List.of("Riptide", "Vance Joy"))));
            list.add(new PlacePersonDto("leo.notes", "male_avatar_1", "Banana Pancakes – Jack Johnson", "gaana",
                    List.of(List.of("Banana Pancakes", "Jack Johnson"), List.of("Put Your Records On", "Corinne Bailey Rae"), List.of("Beyond", "Leon Bridges"))));
        } else {
            list.add(new PlacePersonDto("nova_dream", "female_avatar_3", "Space Song – Beach House", "spotify",
                    List.of(List.of("Space Song", "Beach House"), List.of("Apocalypse", "Cigarettes After Sex"), List.of("Resonance", "HOME"))));
            list.add(new PlacePersonDto("sam.ambient", "male_avatar_3", "Chamber of Reflection – Mac DeMarco", "ytm",
                    List.of(List.of("Chamber of Reflection", "Mac DeMarco"), List.of("Sunsetz", "Cigarettes After Sex"), List.of("Ylang Ylang", "FKJ"))));
        }
        return list;
    }
}
