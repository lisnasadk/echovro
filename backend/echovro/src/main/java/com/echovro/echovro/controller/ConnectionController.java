package com.echovro.echovro.controller;

import com.echovro.echovro.dto.ConnectionRequestDto;
import com.echovro.echovro.dto.RespondConnectionRequest;
import com.echovro.echovro.model.User;
import com.echovro.echovro.service.ConnectionService;
import com.echovro.echovro.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionService connectionService;
    private final UserService userService;

    public ConnectionController(ConnectionService connectionService, UserService userService) {
        this.connectionService = connectionService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getConnections(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        return ResponseEntity.ok(connectionService.getConnections(user.getName()));
    }

    @PostMapping("/request")
    public ResponseEntity<Void> sendRequest(Authentication auth, @RequestBody ConnectionRequestDto req) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        connectionService.sendRequest(user.getName(), req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/respond")
    public ResponseEntity<Void> respondRequest(Authentication auth, @RequestBody RespondConnectionRequest req) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        connectionService.respondRequest(user.getName(), req);
        return ResponseEntity.ok().build();
    }
}
