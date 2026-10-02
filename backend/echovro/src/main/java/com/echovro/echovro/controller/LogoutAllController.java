package com.echovro.echovro.controller;

import com.echovro.echovro.security.LogoutAllService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint to force logout of all currently logged‑in users.
 * It simply flips a flag that is checked in {@link com.echovro.echovro.security.JwtAuthFilter}.
 * When the flag is enabled, JWT authentication is ignored, effectively logging out everybody.
 */
@RestController
@RequestMapping("/api/auth")
public class LogoutAllController {

    private final LogoutAllService logoutAllService;

    @Autowired
    public LogoutAllController(LogoutAllService logoutAllService) {
        this.logoutAllService = logoutAllService;
    }

    @PostMapping("/logout-all")
    public ResponseEntity<String> logoutAllUsers() {
        logoutAllService.enableLogoutAll();
        return ResponseEntity.ok("All users have been logged out.");
    }

    @PostMapping("/clear-logout-all")
    public ResponseEntity<String> clearLogoutAll() {
        logoutAllService.disableLogoutAll();
        return ResponseEntity.ok("Logout‑all flag cleared.");
    }
}
