package com.echovro.echovro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class AblyRealtimeService {

    private final String apiKey;

    public AblyRealtimeService(@Value("${ably.api-key:1JyLXw.8B9B9g:WacRvtOGnAIYm2vAIfpTB-OR4tTSAyhd4lJ1E_tsp0o}") String apiKey) {
        this.apiKey = apiKey;
    }

    public Map<String, Object> createTokenRequest(String clientId) {
        if (apiKey == null || !apiKey.contains(":")) {
            throw new IllegalStateException("Ably API key is not configured");
        }

        String[] parts = apiKey.split(":");
        String keyName = parts[0];
        String keySecret = parts[1];

        long timestamp = System.currentTimeMillis();
        long ttl = 3600000L; // 1 hour token
        String capability = "{\"*\":[\"*\"]}";
        String nonce = UUID.randomUUID().toString().replace("-", "");

        String signText = keyName + "\n" +
                ttl + "\n" +
                capability + "\n" +
                (clientId != null ? clientId : "") + "\n" +
                timestamp + "\n" +
                nonce + "\n";

        String mac;
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hmacBytes = hmac.doFinal(signText.getBytes(StandardCharsets.UTF_8));
            mac = Base64.getEncoder().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC-SHA256 for Ably token", e);
        }

        Map<String, Object> tokenRequest = new LinkedHashMap<>();
        tokenRequest.put("keyName", keyName);
        tokenRequest.put("ttl", ttl);
        tokenRequest.put("capability", capability);
        if (clientId != null && !clientId.isBlank()) {
            tokenRequest.put("clientId", clientId);
        }
        tokenRequest.put("timestamp", timestamp);
        tokenRequest.put("nonce", nonce);
        tokenRequest.put("mac", mac);

        return tokenRequest;
    }
}
