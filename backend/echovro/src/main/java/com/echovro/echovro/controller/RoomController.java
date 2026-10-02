package com.echovro.echovro.controller;

import com.echovro.echovro.dto.RoomEventRequest;
import com.echovro.echovro.model.User;
import com.echovro.echovro.service.SyncService;
import com.echovro.echovro.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/room")
public class RoomController {

    private final SyncService syncService;
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RoomController(SyncService syncService, UserService userService) {
        this.syncService = syncService;
        this.userService = userService;
    }

    @PostMapping("/event")
    public ResponseEntity<Void> sendRoomEvent(Authentication auth, @RequestBody RoomEventRequest req) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", user.getName());
            payload.put("type", req.getType());
            if (req.getLink() != null) payload.put("link", req.getLink());
            if (req.getAt() != null) payload.put("at", req.getAt());
            if (req.getText() != null) payload.put("text", req.getText());
            if (req.getT() != null) payload.put("t", req.getT());
            if (req.getSvc() != null) payload.put("svc", req.getSvc());
            if (req.getCol() != null) payload.put("col", req.getCol());

            syncService.emit(user.getName(), req.getTo(), "room", objectMapper.writeValueAsString(payload));
        } catch (Exception ignored) {}

        return ResponseEntity.ok().build();
    }
}
