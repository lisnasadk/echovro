package com.echovro.echovro.controller;

import com.echovro.echovro.dto.SignalRequest;
import com.echovro.echovro.dto.SyncEventDto;
import com.echovro.echovro.model.User;
import com.echovro.echovro.service.SyncService;
import com.echovro.echovro.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncService syncService;
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SyncController(SyncService syncService, UserService userService) {
        this.syncService = syncService;
        this.userService = userService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<SyncEventDto>> getPendingEvents(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        return ResponseEntity.ok(syncService.pollUndeliveredEvents(user.getName()));
    }

    @PostMapping("/signal")
    public ResponseEntity<Void> sendSignal(Authentication auth, @RequestBody SignalRequest req) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", user.getName());
            payload.put("to", req.getTo());
            payload.put("type", req.getType());
            payload.put("data", req.getData());

            syncService.emit(user.getName(), req.getTo(), "signal", objectMapper.writeValueAsString(payload));
        } catch (Exception ignored) {}

        return ResponseEntity.ok().build();
    }
}
