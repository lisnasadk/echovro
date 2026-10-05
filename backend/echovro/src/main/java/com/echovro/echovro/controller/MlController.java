package com.echovro.echovro.controller;

import com.echovro.echovro.dto.CompatRequestDto;
import com.echovro.echovro.dto.CompatResultDto;
import com.echovro.echovro.dto.MusicPreferencesDto;
import com.echovro.echovro.dto.MusicProfileDto;
import com.echovro.echovro.model.User;
import com.echovro.echovro.service.CompatibilityService;
import com.echovro.echovro.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ml")
public class MlController {

    private final UserService userService;
    private final CompatibilityService compatibilityService;
    private final ObjectMapper mapper = new ObjectMapper();

    public MlController(UserService userService, CompatibilityService compatibilityService) {
        this.userService = userService;
        this.compatibilityService = compatibilityService;
    }

    @GetMapping("/profile")
    public ResponseEntity<MusicProfileDto> getMyProfile(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        MusicProfileDto profile = compatibilityService.parseProfile(user);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> saveProfile(Authentication auth, @RequestBody MusicProfileDto profile) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        try {
            user.setProfileJson(mapper.writeValueAsString(profile));
            userService.saveUser(user);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/preferences")
    public ResponseEntity<MusicProfileDto> savePreferences(Authentication auth, @RequestBody MusicPreferencesDto preferences) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        try {
            user.setPreferencesJson(mapper.writeValueAsString(preferences));
            MusicProfileDto coldStart = compatibilityService.buildProfileFromPreferences(preferences);
            if (coldStart != null) {
                user.setProfileJson(mapper.writeValueAsString(coldStart));
            }
            userService.saveUser(user);
            return ResponseEntity.ok(coldStart);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/preferences")
    public ResponseEntity<MusicPreferencesDto> getPreferences(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        if (user.getPreferencesJson() == null || user.getPreferencesJson().isBlank()) {
            return ResponseEntity.ok(new MusicPreferencesDto());
        }
        try {
            MusicPreferencesDto prefs = mapper.readValue(user.getPreferencesJson(), MusicPreferencesDto.class);
            return ResponseEntity.ok(prefs);
        } catch (Exception e) {
            return ResponseEntity.ok(new MusicPreferencesDto());
        }
    }

    @PostMapping("/compat")
    public ResponseEntity<CompatResultDto> computeCompat(Authentication auth, @RequestBody CompatRequestDto req) {
        Long myId = (Long) auth.getPrincipal();
        User me = userService.getUserById(myId);
        User them;
        try {
            them = userService.getUserByName(req.getTargetUsername());
        } catch (Exception e) {
            CompatResultDto r = new CompatResultDto();
            r.setScore(null);
            r.setLabel("User not found");
            r.setInsufficientData(true);
            return ResponseEntity.ok(r);
        }
        return ResponseEntity.ok(compatibilityService.computeCompat(me, them));
    }
}
