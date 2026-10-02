package com.echovro.echovro.service;

import com.echovro.echovro.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CompatibilityService {

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Calculates compatibility score (0.0 to 100.0) based on musical taste (TF-IDF Cosine Similarity)
     */
    public double calculateCompatibility(User user1, User user2) {
        if (user1.getTracksJson() == null || user2.getTracksJson() == null) {
            return 0.0;
        }

        try {
            List<List<String>> tracks1 = mapper.readValue(user1.getTracksJson(), new TypeReference<>() {});
            List<List<String>> tracks2 = mapper.readValue(user2.getTracksJson(), new TypeReference<>() {});

            if (tracks1.isEmpty() || tracks2.isEmpty()) return 0.0;

            Map<String, Integer> tf1 = extractTermFrequencies(tracks1);
            Map<String, Integer> tf2 = extractTermFrequencies(tracks2);

            Set<String> allTerms = new HashSet<>();
            allTerms.addAll(tf1.keySet());
            allTerms.addAll(tf2.keySet());

            double dotProduct = 0.0;
            double norm1 = 0.0;
            double norm2 = 0.0;

            for (String term : allTerms) {
                // In a real system, IDF would be queried from a database of global terms.
                // For simplicity without massive global data, we use term frequencies.
                double v1 = tf1.getOrDefault(term, 0);
                double v2 = tf2.getOrDefault(term, 0);

                dotProduct += (v1 * v2);
                norm1 += Math.pow(v1, 2);
                norm2 += Math.pow(v2, 2);
            }

            if (norm1 == 0 || norm2 == 0) return 0.0;

            double cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
            return Math.round(cosineSimilarity * 100.0);

        } catch (Exception e) {
            return 0.0;
        }
    }

    private Map<String, Integer> extractTermFrequencies(List<List<String>> tracks) {
        Map<String, Integer> tf = new HashMap<>();
        for (List<String> track : tracks) {
            if (track.size() > 1 && track.get(1) != null) {
                // The term is the Artist name, standardized
                String artist = track.get(1).toLowerCase().replaceAll("[^a-z0-9]", "");
                tf.put(artist, tf.getOrDefault(artist, 0) + 1);
            }
        }
        return tf;
    }
}
