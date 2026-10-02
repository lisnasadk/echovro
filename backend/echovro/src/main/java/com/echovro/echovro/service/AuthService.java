package com.echovro.echovro.service;

import com.echovro.echovro.dto.AuthResponse;
import com.echovro.echovro.dto.LoginRequest;
import com.echovro.echovro.dto.RegisterRequest;
import com.echovro.echovro.exception.ApiException;
import com.echovro.echovro.model.User;
import com.echovro.echovro.repository.UserRepository;
import com.echovro.echovro.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String name = request.getName() == null ? "" : request.getName().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered. Please click 'Log in' instead.");
        }
        if (userRepository.existsByName(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "Username is already taken. Please choose another username.");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);
        String token = jwtService.generate(saved);
        return new AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), token);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtService.generate(user);
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), token);
    }
}

