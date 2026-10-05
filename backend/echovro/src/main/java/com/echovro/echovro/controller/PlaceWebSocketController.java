package com.echovro.echovro.controller;

import com.echovro.echovro.dto.MoveRequest;
import com.echovro.echovro.dto.PresenceEventDto;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class PlaceWebSocketController {

    @MessageMapping("/places/{placeKey}/move")
    @SendTo("/topic/places/{placeKey}/move")
    public MoveRequest broadcastMove(@DestinationVariable("placeKey") String placeKey, MoveRequest req) {
        return req;
    }

    @MessageMapping("/places/{placeKey}/presence")
    @SendTo("/topic/places/{placeKey}/presence")
    public PresenceEventDto broadcastPresence(@DestinationVariable("placeKey") String placeKey, PresenceEventDto event) {
        return event;
    }
}
