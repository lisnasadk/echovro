package com.echovro.echovro.service;

import com.echovro.echovro.dto.CompatResultDto;
import com.echovro.echovro.dto.MusicPreferencesDto;
import com.echovro.echovro.dto.MusicProfileDto;
import com.echovro.echovro.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CompatibilityService {

    public static final List<String> GENRES = List.of(
            "pop", "rock", "hip-hop", "electronic", "r&b", "indie", "classical",
            "ambient", "reggae", "folk", "bollywood", "sufi", "malayalam", "tamil", "jazz",
            "metal", "latin", "country", "blues", "punk", "soul"
    );

    private static final Map<String, List<String>> ARTIST_GENRES = Map.ofEntries(
            Map.entry("the weeknd", List.of("r&b", "pop", "electronic")),
            Map.entry("dua lipa", List.of("pop", "electronic")),
            Map.entry("ed sheeran", List.of("pop", "indie", "folk")),
            Map.entry("taylor swift", List.of("pop", "indie", "folk")),
            Map.entry("drake", List.of("hip-hop", "r&b", "pop")),
            Map.entry("kendrick lamar", List.of("hip-hop")),
            Map.entry("coldplay", List.of("rock", "pop", "indie")),
            Map.entry("arijit singh", List.of("bollywood", "pop", "sufi")),
            Map.entry("a.r. rahman", List.of("bollywood", "electronic", "classical", "sufi")),
            Map.entry("billie eilish", List.of("pop", "electronic", "indie")),
            Map.entry("post malone", List.of("hip-hop", "pop", "rock")),
            Map.entry("daft punk", List.of("electronic")),
            Map.entry("queen", List.of("rock", "pop")),
            Map.entry("pink floyd", List.of("rock", "ambient")),
            Map.entry("vijay yesudas", List.of("malayalam", "bollywood")),
            Map.entry("shreya ghoshal", List.of("bollywood", "classical")),
            Map.entry("anirudh ravichander", List.of("tamil", "electronic", "pop")),
            Map.entry("mohit chauhan", List.of("bollywood", "indie", "folk")),
            Map.entry("miles davis", List.of("jazz")),
            Map.entry("norah jones", List.of("jazz", "indie", "folk")),
            Map.entry("hesham abdul wahab", List.of("malayalam", "indie", "sufi")),
            Map.entry("sushin shyam", List.of("malayalam", "electronic", "rock")),
            Map.entry("k.j. yesudas", List.of("malayalam", "classical", "tamil")),
            Map.entry("vineeth sreenivasan", List.of("malayalam", "pop")),
            Map.entry("thirumali", List.of("hip-hop", "malayalam")),
            Map.entry("vedan", List.of("hip-hop", "malayalam")),
            Map.entry("dhanush", List.of("tamil", "folk")),
            Map.entry("dhee", List.of("tamil", "indie", "r&b")),
            Map.entry("yuvan shankar raja", List.of("tamil", "electronic", "hip-hop")),
            Map.entry("harris jayaraj", List.of("tamil", "electronic", "pop")),
            Map.entry("ilaiyaraaja", List.of("classical", "tamil", "folk")),
            Map.entry("sid sriram", List.of("r&b", "tamil", "indie")),
            Map.entry("atif aslam", List.of("bollywood", "pop", "sufi")),
            Map.entry("sonu nigam", List.of("bollywood", "pop", "classical")),
            Map.entry("badshah", List.of("hip-hop", "pop")),
            Map.entry("divine", List.of("hip-hop")),
            Map.entry("nucleya", List.of("electronic")),
            Map.entry("bruno mars", List.of("pop", "r&b", "soul")),
            Map.entry("harry styles", List.of("pop", "rock", "indie")),
            Map.entry("eminem", List.of("hip-hop")),
            Map.entry("nirvana", List.of("rock")),
            Map.entry("linkin park", List.of("rock", "metal", "electronic"))
    );

    private final ObjectMapper mapper = new ObjectMapper();

    public CompatResultDto computeCompat(User userA, User userB) {
        MusicProfileDto profA = parseProfile(userA);
        MusicProfileDto profB = parseProfile(userB);
        return computeCompatFromProfiles(profA, profB);
    }

    public CompatResultDto computeCompatFromProfiles(MusicProfileDto profA, MusicProfileDto profB) {
        CompatResultDto result = new CompatResultDto();

        boolean aDone = profA != null && profA.isHasData() && profA.getDataCount() >= 2;
        boolean bDone = profB != null && profB.isHasData() && profB.getDataCount() >= 2;

        if (!aDone || !bDone) {
            result.setScore(null);
            result.setLabel("Insufficient data");
            result.setInsufficientData(true);
            result.setShared(List.of());
            result.setMyTop(profA != null && profA.getTopGenres() != null ? profA.getTopGenres() : List.of());
            result.setTheirTop(profB != null && profB.getTopGenres() != null ? profB.getTopGenres() : List.of());
            result.setBridge(null);
            result.setBridgeArtists(List.of());
            return result;
        }

        Map<String, Double> va = profA.getGenreVec();
        Map<String, Double> vb = profB.getGenreVec();
        Set<String> artA = new HashSet<>(profA.getTopArtists() != null ? profA.getTopArtists() : List.of());
        Set<String> artB = new HashSet<>(profB.getTopArtists() != null ? profB.getTopArtists() : List.of());

        // 1. Genre cosine similarity
        double dot = 0, na = 0, nb = 0;
        for (String g : GENRES) {
            double x = va.getOrDefault(g, 0.0), y = vb.getOrDefault(g, 0.0);
            dot += x * y;
            na += x * x;
            nb += y * y;
        }
        double denom = Math.sqrt(na * nb);
        double genreCos = denom > 0 ? dot / denom : 0;

        // 2. Weighted Jaccard on genres
        double mn = 0, mx = 0;
        for (String g : GENRES) {
            mn += Math.min(va.getOrDefault(g, 0.0), vb.getOrDefault(g, 0.0));
            mx += Math.max(va.getOrDefault(g, 0.0), vb.getOrDefault(g, 0.0));
        }
        double genreJaccard = mx > 0 ? mn / mx : 0;

        // 3. Artist overlap (Jaccard)
        Set<String> combined = new HashSet<>(artA);
        combined.addAll(artB);
        long inter = artA.stream().filter(artB::contains).count();
        double artistJaccard = combined.isEmpty() ? 0 : (double) inter / combined.size();

        // 4. Language similarity
        List<String> langA = profA.getLanguages() != null ? profA.getLanguages() : List.of();
        List<String> langB = profB.getLanguages() != null ? profB.getLanguages() : List.of();
        Set<String> langASet = new HashSet<>(langA);
        long langInter = langB.stream().filter(langASet::contains).count();
        double langSim = (langA.size() + langB.size()) > 0 ?
                2.0 * langInter / (langA.size() + langB.size()) : 0.5;

        // 5. Diversity similarity
        double divSim = 1.0 - Math.abs(profA.getDiversity() - profB.getDiversity());

        double raw = 0.50 * genreCos + 0.20 * genreJaccard +
                0.15 * artistJaccard + 0.10 * langSim + 0.05 * divSim;
        int score = (int) Math.round(100 * Math.min(1.0, Math.max(0.0, raw)));

        // Shared top genres
        List<String> shared = GENRES.stream()
                .filter(g -> Math.min(va.getOrDefault(g, 0.0), vb.getOrDefault(g, 0.0)) > 0.04)
                .sorted(Comparator.comparingDouble(g -> -Math.min(va.getOrDefault(g, 0.0), vb.getOrDefault(g, 0.0))))
                .limit(3).collect(Collectors.toList());

        // Bridge genre: strong in B, unfamiliar to A
        String bridge = (profB.getTopGenres() != null ? profB.getTopGenres() : List.<String>of()).stream()
                .filter(g -> va.getOrDefault(g, 0.0) < 0.05).findFirst()
                .orElse(profB.getTopGenres() != null && !profB.getTopGenres().isEmpty() ? profB.getTopGenres().get(0) : null);

        // Bridge artists: B's artists that A doesn't have
        List<String> bridgeArtists = artB.stream().filter(a -> !artA.contains(a)).limit(2).collect(Collectors.toList());

        String label = score >= 80 ? "Musical soulmates" :
                score >= 60 ? "Strong overlap" :
                        score >= 40 ? "Some common ground" :
                                score >= 20 ? "Different worlds — great for discovery" :
                                        "Very different tastes";

        result.setScore(score);
        result.setLabel(label);
        result.setInsufficientData(false);
        result.setShared(shared);
        result.setMyTop(profA.getTopGenres() != null ? profA.getTopGenres() : List.of());
        result.setTheirTop(profB.getTopGenres() != null ? profB.getTopGenres() : List.of());
        result.setBridge(bridge);
        result.setBridgeArtists(bridgeArtists);
        return result;
    }

    public MusicProfileDto parseProfile(User user) {
        if (user == null) return null;

        // 1. Direct taste profile (from Spotify or preferences)
        if (user.getProfileJson() != null && !user.getProfileJson().isBlank()) {
            try {
                return mapper.readValue(user.getProfileJson(), MusicProfileDto.class);
            } catch (Exception ignored) {}
        }

        // 2. Onboarding preferences cold-start backbone
        if (user.getPreferencesJson() != null && !user.getPreferencesJson().isBlank()) {
            try {
                MusicPreferencesDto prefs = mapper.readValue(user.getPreferencesJson(), MusicPreferencesDto.class);
                return buildProfileFromPreferences(prefs);
            } catch (Exception ignored) {}
        }

        // 3. Fallback to listening tracks
        return buildLegacyProfile(user.getTracksJson());
    }

    public MusicProfileDto buildProfileFromPreferences(MusicPreferencesDto prefs) {
        if (prefs == null) return null;
        MusicProfileDto dto = new MusicProfileDto();
        Map<String, Double> genreVec = new LinkedHashMap<>();
        GENRES.forEach(g -> genreVec.put(g, 0.0));

        List<String> artists = new ArrayList<>();
        int dataCount = 0;

        // Add explicit genres
        for (String g : prefs.getGenres()) {
            String ng = g.toLowerCase().trim();
            if (genreVec.containsKey(ng)) {
                genreVec.merge(ng, 2.0, Double::sum);
                dataCount++;
            }
        }

        // Add artists & their inferred genres
        for (String a : prefs.getArtists()) {
            String na = a.toLowerCase().trim();
            if (!na.isEmpty()) {
                artists.add(na);
                dataCount++;
                List<String> mappedGenres = ARTIST_GENRES.get(na);
                if (mappedGenres != null) {
                    for (String mg : mappedGenres) {
                        genreVec.merge(mg, 1.5, Double::sum);
                    }
                }
            }
        }

        double total = genreVec.values().stream().mapToDouble(d -> d).sum();
        if (total > 0) genreVec.replaceAll((g, v) -> v / total);

        List<String> topGenres = GENRES.stream().filter(g -> genreVec.getOrDefault(g, 0.0) > 0.03)
                .sorted(Comparator.comparingDouble(g -> -genreVec.getOrDefault(g, 0.0)))
                .limit(5).collect(Collectors.toList());

        // Diversity (Shannon entropy)
        double entropy = 0;
        for (double p : genreVec.values()) {
            if (p > 0) entropy -= p * (Math.log(p) / Math.log(2));
        }
        double maxEntropy = Math.log(GENRES.size()) / Math.log(2);
        double diversity = maxEntropy > 0 ? entropy / maxEntropy : 0;

        dto.setGenreVec(genreVec);
        dto.setTopGenres(topGenres);
        dto.setTopArtists(artists);
        dto.setLanguages(prefs.getLanguages());
        dto.setDiversity(diversity);
        dto.setDataCount(dataCount);
        dto.setHasData(dataCount >= 2);
        dto.setService("preferences");
        return dto;
    }

    private MusicProfileDto buildLegacyProfile(String tracksJson) {
        MusicProfileDto dto = new MusicProfileDto();
        Map<String, Double> genreVec = new LinkedHashMap<>();
        GENRES.forEach(g -> genreVec.put(g, 0.0));
        List<String> artists = new ArrayList<>();
        int matched = 0;
        try {
            if (tracksJson != null && !tracksJson.isBlank()) {
                List<List<String>> tracks = mapper.readValue(tracksJson, new TypeReference<>() {});
                for (List<String> track : tracks) {
                    String artist = track.size() > 1 && track.get(1) != null ? track.get(1).toLowerCase().trim() : "";
                    if (!artist.isEmpty()) artists.add(artist);
                    List<String> genres = ARTIST_GENRES.get(artist);
                    if (genres != null) {
                        genres.forEach(g -> genreVec.merge(g, 1.0, Double::sum));
                        matched++;
                    }
                }
            }
        } catch (Exception ignored) {}
        double total = genreVec.values().stream().mapToDouble(d -> d).sum();
        if (total > 0) genreVec.replaceAll((g, v) -> v / total);
        List<String> topGenres = GENRES.stream().filter(g -> genreVec.getOrDefault(g, 0.0) > 0.03)
                .sorted(Comparator.comparingDouble(g -> -genreVec.getOrDefault(g, 0.0)))
                .limit(5).collect(Collectors.toList());
        dto.setGenreVec(genreVec);
        dto.setTopGenres(topGenres);
        dto.setTopArtists(artists);
        dto.setLanguages(List.of());
        dto.setDiversity(0);
        dto.setDataCount(matched);
        dto.setHasData(matched >= 2);
        return dto;
    }

    /**
     * Backward-compatible simple score
     */
    public double calculateCompatibility(User user1, User user2) {
        CompatResultDto res = computeCompat(user1, user2);
        return res.getScore() != null ? res.getScore().doubleValue() : 0.0;
    }
}
