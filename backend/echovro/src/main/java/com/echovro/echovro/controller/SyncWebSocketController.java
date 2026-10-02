package com.echovro.echovro.controller;

import com.echovro.echovro.dto.SyncEventDto;
import com.echovro.echovro.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * WebSocket endpoint for real‑time sync events.
 * Clients subscribe to "/topic/sync" and send a message to "/app/sync" to
 * request any pending events. The server responds with a list of {@link SyncEventDto}.
 */
@Controller
public class SyncWebSocketController {

    private final SyncService syncService;

    @Autowired
    public SyncWebSocketController(SyncService syncService) {
        this.syncService = syncService;
    }

    @MessageMapping("/sync")
    @SendTo("/topic/sync")
    public SyncEventDto[] fetchSyncEvents(String username) {
        // The SyncService already provides a method to fetch undelivered events.
        // For simplicity we retrieve all pending events for the user and return them.
        return syncService.getUndeliveredEvents(username).toArray(new SyncEventDto[0]);
    }
}
