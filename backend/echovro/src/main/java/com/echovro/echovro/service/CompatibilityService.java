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
            Map.entry("the beatles", List.of("rock", "pop", "folk")),
            Map.entry("bob marley", List.of("reggae", "folk", "rock")),
            Map.entry("a.r. rahman", List.of("bollywood", "sufi", "electronic", "classical")),
            Map.entry("arijit singh", List.of("bollywood", "pop", "sufi")),
            Map.entry("the weeknd", List.of("r&b", "pop", "electronic")),
            Map.entry("dua lipa", List.of("pop", "electronic", "r&b")),
            Map.entry("vijay yesudas", List.of("malayalam", "bollywood")),
            Map.entry("ed sheeran", List.of("pop", "indie", "folk")),
            Map.entry("mohit chauhan", List.of("bollywood", "indie", "folk")),
            Map.entry("jack johnson", List.of("indie", "folk", "reggae", "pop")),
            Map.entry("claude debussy", List.of("classical")),
            Map.entry("erik satie", List.of("classical", "ambient")),
            Map.entry("marconi union", List.of("ambient", "electronic")),
            Map.entry("tochi raina", List.of("bollywood", "sufi", "indie")),
            Map.entry("coldplay", List.of("rock", "pop", "indie")),
            Map.entry("taylor swift", List.of("pop", "indie", "folk")),
            Map.entry("drake", List.of("hip-hop", "r&b", "pop")),
            Map.entry("kendrick lamar", List.of("hip-hop", "r&b")),
            Map.entry("daft punk", List.of("electronic", "pop")),
            Map.entry("adele", List.of("pop", "r&b", "jazz")),
            Map.entry("nusrat fateh ali khan", List.of("sufi", "classical")),
            Map.entry("kk", List.of("bollywood", "rock", "pop")),
            Map.entry("shreya ghoshal", List.of("bollywood", "classical")),
            Map.entry("sid sriram", List.of("r&b", "bollywood", "indie")),
            Map.entry("anirudh ravichander", List.of("bollywood", "electronic", "pop")),
            Map.entry("miles davis", List.of("jazz")),
            Map.entry("norah jones", List.of("jazz", "indie", "folk")),
            Map.entry("radiohead", List.of("rock", "indie", "electronic")),
            Map.entry("billie eilish", List.of("pop", "electronic", "indie")),
            Map.entry("post malone", List.of("hip-hop", "pop", "rock")),
            Map.entry("imagine dragons", List.of("rock", "pop", "electronic")),
            Map.entry("queen", List.of("rock", "pop")),
            Map.entry("pink floyd", List.of("rock", "ambient")),
            Map.entry("ludovico einaudi", List.of("classical", "ambient")),
            Map.entry("hans zimmer", List.of("classical", "ambient", "electronic")),
            Map.entry("hesham abdul wahab", List.of("malayalam", "indie", "sufi")),
            Map.entry("sooraj santhosh", List.of("malayalam", "indie", "r&b")),
            Map.entry("shaan rahman", List.of("malayalam", "pop")),
            Map.entry("k.s. harisankar", List.of("malayalam", "classical")),
            Map.entry("ayraan", List.of("malayalam", "indie")),
            Map.entry("vineeth sreenivasan", List.of("malayalam", "pop")),
            Map.entry("mithun jayaraj", List.of("malayalam", "folk")),
            Map.entry("haricharan", List.of("malayalam", "tamil", "classical")),
            Map.entry("k.j. yesudas", List.of("malayalam", "classical", "tamil")),
            Map.entry("m.g. sreekumar", List.of("malayalam", "folk", "classical")),
            Map.entry("shahabaz aman", List.of("malayalam", "sufi", "indie")),
            Map.entry("job kurian", List.of("malayalam", "indie", "rock")),
            Map.entry("sushin shyam", List.of("malayalam", "electronic", "rock")),
            Map.entry("benny dayal", List.of("pop", "tamil", "electronic")),
            Map.entry("navin madhav", List.of("malayalam", "rock")),
            Map.entry("sithara krishnakumar", List.of("malayalam", "classical", "folk")),
            Map.entry("siddharth menon", List.of("malayalam", "pop", "indie")),
            Map.entry("sujatha mohan", List.of("malayalam", "tamil", "classical")),
            Map.entry("k.s. chithra", List.of("malayalam", "tamil", "classical")),
            Map.entry("niranj suresh", List.of("malayalam", "rock")),
            Map.entry("mohammed maqbool mansoor", List.of("malayalam", "sufi")),
            Map.entry("jithin raj", List.of("malayalam", "classical")),
            Map.entry("vedan", List.of("hip-hop", "malayalam")),
            Map.entry("thirumali", List.of("hip-hop", "malayalam")),
            Map.entry("jassie gift", List.of("malayalam", "reggae", "pop")),
            Map.entry("karthik", List.of("tamil", "malayalam", "pop")),
            Map.entry("afsal", List.of("malayalam", "folk")),
            Map.entry("gopi sundar", List.of("malayalam", "tamil", "electronic")),
            Map.entry("unni mukundan", List.of("malayalam", "pop")),
            Map.entry("sreenath bhasi", List.of("malayalam", "hip-hop", "electronic")),
            Map.entry("rex vijayan", List.of("indie", "rock", "malayalam")),
            Map.entry("jakes bejoy", List.of("malayalam", "electronic")),
            Map.entry("sanah moidutty", List.of("pop", "malayalam", "folk")),
            Map.entry("p. jayachandran", List.of("malayalam", "classical")),
            Map.entry("dhanush", List.of("tamil", "folk")),
            Map.entry("dhee", List.of("tamil", "indie", "r&b")),
            Map.entry("hariharan", List.of("classical", "tamil", "bollywood")),
            Map.entry("bombay jayashri", List.of("classical", "tamil")),
            Map.entry("vijay prakash", List.of("tamil", "classical", "bollywood")),
            Map.entry("vijay", List.of("tamil", "pop")),
            Map.entry("ilaiyaraaja", List.of("classical", "tamil", "folk")),
            Map.entry("unni menon", List.of("tamil", "malayalam", "classical")),
            Map.entry("kailash kher", List.of("sufi", "folk", "bollywood")),
            Map.entry("shashaa tirupati", List.of("pop", "tamil", "indie")),
            Map.entry("sathya prakash", List.of("classical", "tamil")),
            Map.entry("d. imman", List.of("tamil", "folk")),
            Map.entry("silambarasan tr", List.of("tamil", "electronic")),
            Map.entry("harris jayaraj", List.of("tamil", "electronic", "pop")),
            Map.entry("shakthisree gopalan", List.of("indie", "tamil", "jazz")),
            Map.entry("shankar mahadevan", List.of("classical", "bollywood", "tamil")),
            Map.entry("yuvan shankar raja", List.of("tamil", "electronic", "hip-hop")),
            Map.entry("sukhwinder singh", List.of("bollywood", "folk", "sufi")),
            Map.entry("vishal mishra", List.of("bollywood", "indie", "pop")),
            Map.entry("akhil sachdeva", List.of("bollywood", "indie")),
            Map.entry("atif aslam", List.of("bollywood", "pop", "sufi")),
            Map.entry("sonu nigam", List.of("bollywood", "pop", "classical")),
            Map.entry("roop kumar rathod", List.of("sufi", "bollywood")),
            Map.entry("ankit tiwari", List.of("bollywood", "rock", "indie")),
            Map.entry("amit trivedi", List.of("indie", "bollywood", "folk")),
            Map.entry("vishal dadlani", List.of("rock", "bollywood", "electronic")),
            Map.entry("sreerama chandra", List.of("bollywood", "pop")),
            Map.entry("neha kakkar", List.of("pop", "bollywood")),
            Map.entry("badshah", List.of("hip-hop", "pop")),
            Map.entry("ranveer singh", List.of("hip-hop", "bollywood")),
            Map.entry("divine", List.of("hip-hop")),
            Map.entry("nucleya", List.of("electronic")),
            Map.entry("mohammed irfan", List.of("bollywood", "sufi")),
            Map.entry("priya saraiya", List.of("bollywood", "indie")),
            Map.entry("lata mangeshkar", List.of("classical", "bollywood")),
            Map.entry("udit narayan", List.of("bollywood", "folk")),
            Map.entry("kumar sanu", List.of("bollywood", "pop")),
            Map.entry("javed ali", List.of("sufi", "bollywood")),
            Map.entry("rekha bhardwaj", List.of("folk", "sufi", "bollywood")),
            Map.entry("harshdeep kaur", List.of("sufi", "folk")),
            Map.entry("pawni pandey", List.of("bollywood", "pop")),
            Map.entry("diljit dosanjh", List.of("hip-hop", "pop", "folk")),
            Map.entry("bruno mars", List.of("pop", "r&b", "soul")),
            Map.entry("harry styles", List.of("pop", "rock", "indie")),
            Map.entry("eminem", List.of("hip-hop")),
            Map.entry("nirvana", List.of("rock")),
            Map.entry("linkin park", List.of("rock", "metal", "electronic")),
            Map.entry("metallica", List.of("metal", "rock"))
    );

    private final ObjectMapper mapper = new ObjectMapper();

    public static List<String> getGenresForArtist(String artist) {
        if (artist == null || artist.isBlank()) return null;
        String raw = artist.toLowerCase().trim();
        List<String> direct = ARTIST_GENRES.get(raw);
        if (direct != null) return direct;
        String norm = raw.replaceAll("[^a-z0-9]", "");
        for (Map.Entry<String, List<String>> e : ARTIST_GENRES.entrySet()) {
            String kNorm = e.getKey().replaceAll("[^a-z0-9]", "");
            if (kNorm.equals(norm) || kNorm.contains(norm) || norm.contains(kNorm)) {
                return e.getValue();
            }
        }
        return null;
    }

    public CompatResultDto computeCompat(User userA, User userB) {
        MusicProfileDto profA = parseProfile(userA);
        MusicProfileDto profB = parseProfile(userB);
        return computeCompatFromProfiles(profA, profB);
    }

    public CompatResultDto computeCompatFromProfiles(MusicProfileDto profA, MusicProfileDto profB) {
        CompatResultDto result = new CompatResultDto();

        boolean aDone = profA != null && profA.isHasData() && profA.getDataCount() >= 1;
        boolean bDone = profB != null && profB.isHasData() && profB.getDataCount() >= 1;

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

        // 1. PRIMARY INPUT: User's explicitly selected music preferences
        if (user.getPreferencesJson() != null && !user.getPreferencesJson().isBlank()) {
            try {
                MusicPreferencesDto prefs = mapper.readValue(user.getPreferencesJson(), MusicPreferencesDto.class);
                if (prefs != null && ((prefs.getArtists() != null && !prefs.getArtists().isEmpty()) ||
                                      (prefs.getGenres() != null && !prefs.getGenres().isEmpty()))) {
                    return buildProfileFromPreferences(prefs);
                }
            } catch (Exception ignored) {}
        }

        // 2. Direct taste profile (from Spotify if no manual preferences selected)
        if (user.getProfileJson() != null && !user.getProfileJson().isBlank()) {
            try {
                return mapper.readValue(user.getProfileJson(), MusicProfileDto.class);
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
        if (prefs.getGenres() != null) {
            for (String g : prefs.getGenres()) {
                String ng = g.toLowerCase().trim();
                if (genreVec.containsKey(ng)) {
                    genreVec.merge(ng, 2.0, Double::sum);
                    dataCount++;
                }
            }
        }

        // Add artists & their inferred genres from 500-track knowledge base
        if (prefs.getArtists() != null) {
            for (String a : prefs.getArtists()) {
                String na = a.toLowerCase().trim();
                if (!na.isEmpty()) {
                    artists.add(na);
                    dataCount++;
                    List<String> mappedGenres = getGenresForArtist(na);
                    if (mappedGenres != null) {
                        for (String mg : mappedGenres) {
                            genreVec.merge(mg, 1.5, Double::sum);
                        }
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
        dto.setLanguages(prefs.getLanguages() != null ? prefs.getLanguages() : List.of());
        dto.setDiversity(diversity);
        dto.setDataCount(dataCount);
        dto.setHasData(dataCount >= 1);
        dto.setService("preferences");
        return dto;
    }

    private static final Map<String, List<String>> LEGACY_GENRES = Map.of(
            "the weeknd", List.of("r&b", "pop", "electronic"),
            "dua lipa", List.of("pop", "electronic"),
            "ed sheeran", List.of("pop", "indie", "folk"),
            "taylor swift", List.of("pop", "indie", "folk"),
            "drake", List.of("hip-hop", "r&b"),
            "kendrick lamar", List.of("hip-hop"),
            "coldplay", List.of("rock", "pop", "indie"),
            "arijit singh", List.of("bollywood"),
            "a.r. rahman", List.of("bollywood", "electronic", "classical")
    );

    private MusicProfileDto buildLegacyProfile(String tracksJson) {
        MusicProfileDto dto = new MusicProfileDto();
        Map<String, Double> genreVec = new LinkedHashMap<>();
        GENRES.forEach(g -> genreVec.put(g, 0.0));
        List<String> artists = new ArrayList<>();
        int matched = 0;
        try {
            List<List<String>> tracks = mapper.readValue(tracksJson, new TypeReference<>() {});
            for (List<String> track : tracks) {
                String artist = track.size() > 1 ? track.get(1).toLowerCase().trim() : "";
                if (!artist.isEmpty()) artists.add(artist);
                List<String> genres = getGenresForArtist(artist);
                if (genres == null) genres = LEGACY_GENRES.get(artist);
                if (genres != null) {
                    genres.forEach(g -> genreVec.merge(g, 1.0, Double::sum));
                    matched++;
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
        dto.setHasData(matched >= 1);
        return dto;
    }
}
