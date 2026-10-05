package com.echovro.echovro.controller;

import com.echovro.echovro.model.User;
import com.echovro.echovro.service.AblyRealtimeService;
import com.echovro.echovro.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/realtime")
public class RealtimeController {

    private final AblyRealtimeService ablyService;
    private final UserService userService;

    public RealtimeController(AblyRealtimeService ablyService, UserService userService) {
        this.ablyService = ablyService;
        this.userService = userService;
    }

    @GetMapping("/token")
    public ResponseEntity<Map<String, Object>> getToken(
            Authentication auth,
            @RequestParam(value = "clientId", required = false) String requestedClientId) {

        String clientId = null;
        if (auth != null && auth.getPrincipal() instanceof Long userId) {
            try {
                User u = userService.getUserById(userId);
                if (u != null) clientId = u.getName();
            } catch (Exception ignored) {}
        }
        if (clientId == null && requestedClientId != null && !requestedClientId.isBlank()) {
            clientId = requestedClientId.trim();
        }
        if (clientId == null || clientId.isBlank()) {
            clientId = "guest-" + UUID.randomUUID().toString().substring(0, 8);
        }

        Map<String, Object> tokenRequest = ablyService.createTokenRequest(clientId);
        return ResponseEntity.ok(tokenRequest);
    }
}
