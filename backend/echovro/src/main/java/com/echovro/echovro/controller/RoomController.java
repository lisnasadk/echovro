package com.echovro.echovro.controller;

import com.echovro.echovro.dto.RoomEventRequest;
import com.echovro.echovro.dto.SongSnapDto;
import com.echovro.echovro.model.SongSnap;
import com.echovro.echovro.model.User;
import com.echovro.echovro.repository.SongSnapRepository;
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
@RequestMapping("/api/room")
public class RoomController {

    private final SyncService syncService;
    private final UserService userService;
    private final SongSnapRepository songSnapRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RoomController(SyncService syncService, UserService userService, SongSnapRepository songSnapRepository) {
        this.syncService = syncService;
        this.userService = userService;
        this.songSnapRepository = songSnapRepository;
    }

    @PostMapping("/event")
    public ResponseEntity<Void> sendRoomEvent(Authentication auth, @RequestBody RoomEventRequest req) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);

        try {
            // Permanently persist song snaps (CDs) to database
            if ("cd".equalsIgnoreCase(req.getType()) && req.getT() != null && req.getTo() != null) {
                SongSnap snap = new SongSnap(
                        user.getName(),
                        req.getTo(),
                        req.getT(),
                        req.getSvc(),
                        req.getLink(),
                        req.getCol() != null ? req.getCol() : "aurora"
                );
                songSnapRepository.save(snap);
            }

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

    @GetMapping("/snaps")
    public ResponseEntity<List<SongSnapDto>> getSnaps(Authentication auth,
                                                      @RequestParam(name = "with", required = false) String withUser) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);

        List<SongSnap> snaps;
        if (withUser != null && !withUser.isBlank()) {
            snaps = songSnapRepository.findConversationSnaps(user.getName(), withUser.trim());
        } else {
            snaps = songSnapRepository.findByRecipientOrSenderOrderByCreatedAtDesc(user.getName(), user.getName());
        }

        List<SongSnapDto> dtos = snaps.stream().map(s -> new SongSnapDto(
                s.getId(),
                s.getTitle(),
                s.getService(),
                s.getLink(),
                s.getColor(),
                s.getSender(),
                user.getName().equalsIgnoreCase(s.getSender()),
                s.getCreatedAt() != null ? s.getCreatedAt().toString() : ""
        )).toList();

        return ResponseEntity.ok(dtos);
    }
}
