package com.echovro.echovro.controller;

import com.echovro.echovro.dto.SendChatRequest;
import com.echovro.echovro.model.User;
import com.echovro.echovro.service.ChatService;
import com.echovro.echovro.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    @GetMapping("/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages(
            Authentication auth,
            @RequestParam("with") String withUser) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        return ResponseEntity.ok(chatService.getHistory(user.getName(), withUser));
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(
            Authentication auth,
            @RequestBody SendChatRequest req) {
        Long id = (Long) auth.getPrincipal();
        User user = userService.getUserById(id);
        chatService.sendMessage(user.getName(), req);
        return ResponseEntity.ok().build();
    }
}
