package com.echovro.echovro.controller;

import com.echovro.echovro.dto.PlaceFeedResponse;
import com.echovro.echovro.dto.SetSongRequest;
import com.echovro.echovro.service.PlaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping("/{placeKey}/feed")
    public ResponseEntity<PlaceFeedResponse> getFeed(
            @PathVariable("placeKey") String placeKey,
            @RequestParam(value = "user", required = false) String user) {
        return ResponseEntity.ok(placeService.getFeed(placeKey, user));
    }

    @PostMapping("/{placeKey}/song")
    public ResponseEntity<Void> setSong(
            @PathVariable("placeKey") String placeKey,
            @RequestBody SetSongRequest request) {
        placeService.setSong(placeKey, request.getUsername(), request.getSong());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{placeKey}/join")
    public ResponseEntity<Void> joinPlace(
            @PathVariable("placeKey") String placeKey,
            @RequestParam("user") String user) {
        placeService.joinPlace(placeKey, user);
        return ResponseEntity.ok().build();
    }
}
