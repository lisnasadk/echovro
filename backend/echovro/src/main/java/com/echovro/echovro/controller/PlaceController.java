package com.echovro.echovro.controller;

import com.echovro.echovro.dto.MoveRequest;
import com.echovro.echovro.dto.PlaceFeedResponse;
import com.echovro.echovro.dto.PresenceEventDto;
import com.echovro.echovro.dto.SetSongRequest;
import com.echovro.echovro.service.PlaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;
    private final SimpMessagingTemplate messagingTemplate;

    public PlaceController(PlaceService placeService, SimpMessagingTemplate messagingTemplate) {
        this.placeService = placeService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/{placeKey}/feed")
    public ResponseEntity<PlaceFeedResponse> getFeed(
            @PathVariable("placeKey") String placeKey,
            @RequestParam(value = "user", required = false) String user) {
        return ResponseEntity.ok(placeService.getFeed(placeKey, user));
    }

    @PostMapping("/{placeKey}/move")
    public ResponseEntity<Void> moveUser(
            @PathVariable("placeKey") String placeKey,
            @RequestBody MoveRequest req) {
        placeService.updatePosition(placeKey, req.getUser(), req.getPx(), req.getPy(), req.getPz(), req.getRy(), req.isMoving(), req.isSit());
        try {
            messagingTemplate.convertAndSend("/topic/places/" + placeKey + "/move", req);
        } catch (Exception ignored) {}
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{placeKey}/song")
    public ResponseEntity<Void> setSong(
            @PathVariable("placeKey") String placeKey,
            @RequestBody SetSongRequest request) {
        placeService.setSong(placeKey, request.getUsername(), request.getSong());
        try {
            PresenceEventDto ev = new PresenceEventDto("song", request.getUsername());
            ev.setSong(request.getSong());
            messagingTemplate.convertAndSend("/topic/places/" + placeKey + "/presence", ev);
        } catch (Exception ignored) {}
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{placeKey}/join")
    public ResponseEntity<Void> joinPlace(
            @PathVariable("placeKey") String placeKey,
            @RequestParam("user") String user) {
        placeService.joinPlace(placeKey, user);
        try {
            messagingTemplate.convertAndSend("/topic/places/" + placeKey + "/presence", new PresenceEventDto("join", user));
        } catch (Exception ignored) {}
        return ResponseEntity.ok().build();
    }

    @PostMapping("/leave")
    public ResponseEntity<Void> leavePlace(@RequestParam("user") String user) {
        placeService.leavePlace(user);
        return ResponseEntity.ok().build();
    }
}
