package com.echovro.echovro.service;

import com.echovro.echovro.dto.ConnectionRequestDto;
import com.echovro.echovro.dto.RespondConnectionRequest;
import com.echovro.echovro.model.Connection;
import com.echovro.echovro.model.User;
import com.echovro.echovro.repository.ConnectionRepository;
import com.echovro.echovro.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final SyncService syncService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ConnectionService(ConnectionRepository connectionRepository, UserRepository userRepository, SyncService syncService) {
        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
        this.syncService = syncService;
    }

    public List<Map<String, Object>> getConnections(String currentUsername) {
        List<Connection> list = connectionRepository.findAllForUser(currentUsername);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Connection c : list) {
            boolean isFromMe = c.getFromUser().equalsIgnoreCase(currentUsername);
            String otherUsername = isFromMe ? c.getToUser() : c.getFromUser();
            Optional<User> otherOpt = userRepository.findByName(otherUsername);

            Map<String, Object> map = new HashMap<>();
            map.put("u", otherUsername);
            map.put("av", otherOpt.map(User::getAvatar).orElse("male_avatar_1"));
            map.put("m", otherOpt.map(User::getMusicService).orElse("spotify"));
            map.put("status", "CONNECTED".equalsIgnoreCase(c.getStatus()) ? "connected" : "pending");
            map.put("dir", isFromMe ? "out" : "in");

            Map<String, Object> songMap = new HashMap<>();
            songMap.put("t", c.getSongTitle() != null ? c.getSongTitle() : "");
            songMap.put("svc", c.getSongService() != null ? c.getSongService() : "spotify");
            songMap.put("link", c.getSongLink() != null ? c.getSongLink() : "");
            map.put("song", songMap);

            result.add(map);
        }
        return result;
    }

    @Transactional
    public void sendRequest(String fromUser, ConnectionRequestDto req) {
        if (req.getTo() == null || req.getTo().equalsIgnoreCase(fromUser)) return;

        Optional<Connection> existingOpt = connectionRepository.findBetweenUsers(fromUser, req.getTo());
        Connection conn = existingOpt.orElseGet(() -> new Connection(fromUser, req.getTo(), "PENDING", null, null, null));

        conn.setFromUser(fromUser);
        conn.setToUser(req.getTo());
        conn.setStatus("PENDING");
        if (req.getSong() != null) {
            conn.setSongTitle(req.getSong().getT());
            conn.setSongService(req.getSong().getSvc());
            conn.setSongLink(req.getSong().getLink());
        }
        conn.setUpdatedAt(LocalDateTime.now());
        connectionRepository.save(conn);

        // Emit sync event for real-time notification to recipient
        try {
            Optional<User> fromOpt = userRepository.findByName(fromUser);
            Map<String, Object> payload = new HashMap<>();
            payload.put("u", fromUser);
            payload.put("av", fromOpt.map(User::getAvatar).orElse("male_avatar_1"));
            payload.put("m", fromOpt.map(User::getMusicService).orElse("spotify"));
            Map<String, Object> songPayload = new HashMap<>();
            if (req.getSong() != null) {
                songPayload.put("t", req.getSong().getT());
                songPayload.put("svc", req.getSong().getSvc());
                songPayload.put("link", req.getSong().getLink());
            }
            payload.put("song", songPayload);

            syncService.emit(fromUser, req.getTo(), "request", objectMapper.writeValueAsString(payload));
        } catch (Exception ignored) {}
    }

    @Transactional
    public void respondRequest(String fromUser, RespondConnectionRequest req) {
        if (req.getTo() == null) return;
        Optional<Connection> existingOpt = connectionRepository.findBetweenUsers(fromUser, req.getTo());
        if (existingOpt.isPresent()) {
            Connection conn = existingOpt.get();
            if (req.isAccept()) {
                conn.setStatus("CONNECTED");
                conn.setUpdatedAt(LocalDateTime.now());
                connectionRepository.save(conn);

                // Notify requester that request was accepted
                try {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("u", fromUser);
                    syncService.emit(fromUser, req.getTo(), "accepted", objectMapper.writeValueAsString(payload));
                } catch (Exception ignored) {}
            } else {
                conn.setStatus("DECLINED");
                conn.setUpdatedAt(LocalDateTime.now());
                connectionRepository.save(conn);
            }
        }
    }
}
