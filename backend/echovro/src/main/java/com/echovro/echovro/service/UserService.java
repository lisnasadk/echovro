package com.echovro.echovro.service;

import com.echovro.echovro.dto.MusicPreferencesDto;
import com.echovro.echovro.dto.ProfileDto;
import com.echovro.echovro.dto.UpdateProfileRequest;
import com.echovro.echovro.exception.ApiException;
import com.echovro.echovro.model.User;
import com.echovro.echovro.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User getUserByName(String name) {
        return userRepository.findByName(name)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found: " + name));
    }

    public ProfileDto getProfile(Long id) {
        User u = getUserById(id);
        List<List<String>> tracks = parseTracks(u.getTracksJson());
        MusicPreferencesDto prefs = parsePreferences(u.getPreferencesJson());
        return new ProfileDto(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getGender(),
                u.getAvatar(),
                u.getMusicService(),
                u.getCurrentPlace(),
                u.getCurrentSong(),
                tracks,
                prefs
        );
    }

    @Transactional
    public ProfileDto updateProfile(Long id, UpdateProfileRequest req) {
        User u = getUserById(id);
        if (req.getGender() != null) u.setGender(req.getGender());
        if (req.getAvatar() != null) u.setAvatar(req.getAvatar());
        if (req.getMusic() != null) {
            if (req.getMusic().getService() != null) u.setMusicService(req.getMusic().getService());
            if (req.getMusic().getCode() != null) u.setMusicCode(req.getMusic().getCode());
        }
        if (req.getTracks() != null) {
            try {
                u.setTracksJson(objectMapper.writeValueAsString(req.getTracks()));
            } catch (Exception ignored) {}
        }
        if (req.getPreferences() != null) {
            try {
                u.setPreferencesJson(objectMapper.writeValueAsString(req.getPreferences()));
            } catch (Exception ignored) {}
        }
        u.setLastActive(LocalDateTime.now());
        User saved = userRepository.save(u);
        return getProfile(saved.getId());
    }

    @Transactional
    public void saveUser(User user) {
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);
    }

    public List<List<String>> getUserTracks(Long id, String service) {
        User u = getUserById(id);
        List<List<String>> tracks = parseTracks(u.getTracksJson());
        if (tracks.isEmpty()) {
            tracks = getDefaultTracksForService(service != null ? service : u.getMusicService());
        }
        return tracks;
    }

    private List<List<String>> parseTracks(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<List<String>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private MusicPreferencesDto parsePreferences(String json) {
        if (json == null || json.isBlank()) return new MusicPreferencesDto();
        try {
            return objectMapper.readValue(json, MusicPreferencesDto.class);
        } catch (Exception e) {
            return new MusicPreferencesDto();
        }
    }

    public List<List<String>> getDefaultTracksForService(String service) {
        List<List<String>> sample = new ArrayList<>();
        if ("spotify".equalsIgnoreCase(service)) {
            sample.add(List.of("Starboy", "The Weeknd"));
            sample.add(List.of("Blinding Lights", "The Weeknd"));
            sample.add(List.of("As It Was", "Harry Styles"));
            sample.add(List.of("Cruel Summer", "Taylor Swift"));
            sample.add(List.of("Levitating", "Dua Lipa"));
        } else if ("ytm".equalsIgnoreCase(service)) {
            sample.add(List.of("Nightcall", "Kavinsky"));
            sample.add(List.of("Midnight City", "M83"));
            sample.add(List.of("Instant Crush", "Daft Punk"));
            sample.add(List.of("Save Your Tears", "The Weeknd"));
        } else {
            sample.add(List.of("Tum Hi Ho", "Arijit Singh"));
            sample.add(List.of("Kesariya", "Arijit Singh"));
            sample.add(List.of("Raataan Lambiyan", "Jubin Nautiyal"));
            sample.add(List.of("Shayad", "Pritam"));
        }
        return sample;
    }
}
