package com.echovro.echovro.controller;

import com.echovro.echovro.dto.AuthResponse;
import com.echovro.echovro.exception.ApiException;
import com.echovro.echovro.model.User;
import com.echovro.echovro.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Protected endpoint: proves the JWT works. GET /api/me with header  Authorization: Bearer <token> */
@RestController
@RequestMapping("/api")
public class MeController {

    private final UserRepository userRepository;

    public MeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public AuthResponse me(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return new AuthResponse(u.getId(), u.getName(), u.getEmail(), null);
    }
}
