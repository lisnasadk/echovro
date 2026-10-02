package com.echovro.echovro.controller;

import com.echovro.echovro.dto.ProfileDto;
import com.echovro.echovro.dto.UpdateProfileRequest;
import com.echovro.echovro.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserService userService;

    public MeController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ProfileDto me(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        return userService.getProfile(id);
    }

    @PutMapping("/profile")
    public ProfileDto updateProfile(Authentication auth, @RequestBody UpdateProfileRequest request) {
        Long id = (Long) auth.getPrincipal();
        return userService.updateProfile(id, request);
    }

    @GetMapping("/tracks")
    public List<List<String>> tracks(Authentication auth, @RequestParam(value = "service", required = false) String service) {
        Long id = (Long) auth.getPrincipal();
        return userService.getUserTracks(id, service);
    }
}
