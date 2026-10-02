package com.echovro.echovro.service;

import com.echovro.echovro.dto.SendChatRequest;
import com.echovro.echovro.model.ChatMessage;
import com.echovro.echovro.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final SyncService syncService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatService(ChatMessageRepository chatMessageRepository, SyncService syncService) {
        this.chatMessageRepository = chatMessageRepository;
        this.syncService = syncService;
    }

    public List<Map<String, Object>> getHistory(String user1, String user2) {
        List<ChatMessage> list = chatMessageRepository.findChatHistory(user1, user2);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatMessage m : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("me", m.getFromUser().equalsIgnoreCase(user1) ? 1 : 0);
            map.put("t", m.getText());
            map.put("from", m.getFromUser());
            map.put("to", m.getToUser());
            map.put("time", m.getCreatedAt().toString());
            result.add(map);
        }
        return result;
    }

    @Transactional
    public void sendMessage(String fromUser, SendChatRequest req) {
        if (req.getTo() == null || req.getText() == null || req.getText().isBlank()) return;

        ChatMessage msg = new ChatMessage(fromUser, req.getTo(), req.getText().trim());
        chatMessageRepository.save(msg);

        // Emit real-time sync event
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", fromUser);
            payload.put("text", req.getText().trim());
            syncService.emit(fromUser, req.getTo(), "message", objectMapper.writeValueAsString(payload));
        } catch (Exception ignored) {}
    }
}
