package com.echovro.echovro.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/voice")
public class VoiceController {

    private static final Logger log = LoggerFactory.getLogger(VoiceController.class);

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @GetMapping("/ice-servers")
    public ResponseEntity<List<Map<String, Object>>> getIceServers() {
        if (twilioAccountSid != null && !twilioAccountSid.isBlank()
                && twilioAuthToken != null && !twilioAuthToken.isBlank()) {
            try {
                String auth = twilioAccountSid.trim() + ":" + twilioAuthToken.trim();
                String basicAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
                String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid.trim() + "/Tokens.json";

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(5))
                        .header("Authorization", "Basic " + basicAuth)
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .POST(HttpRequest.BodyPublishers.noBody())
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode iceServersNode = root.get("ice_servers");
                    if (iceServersNode != null && iceServersNode.isArray()) {
                        List<Map<String, Object>> iceServers = new ArrayList<>();
                        for (JsonNode s : iceServersNode) {
                            Map<String, Object> map = new HashMap<>();
                            if (s.has("urls")) {
                                map.put("urls", s.get("urls").asText());
                            } else if (s.has("url")) {
                                map.put("urls", s.get("url").asText());
                            }
                            if (s.has("username")) {
                                map.put("username", s.get("username").asText());
                            }
                            if (s.has("credential")) {
                                map.put("credential", s.get("credential").asText());
                            }
                            iceServers.add(map);
                        }
                        if (!iceServers.isEmpty()) {
                            return ResponseEntity.ok(iceServers);
                        }
                    }
                } else {
                    log.warn("Twilio ICE token response status: {}", response.statusCode());
                }
            } catch (Exception e) {
                log.warn("Error fetching Twilio ICE servers: {}", e.getMessage());
            }
        }

        // Standard fallback STUN servers
        List<Map<String, Object>> fallback = new ArrayList<>();
        Map<String, Object> gStun = new HashMap<>();
        gStun.put("urls", List.of("stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"));
        fallback.add(gStun);
        return ResponseEntity.ok(fallback);
    }
}
