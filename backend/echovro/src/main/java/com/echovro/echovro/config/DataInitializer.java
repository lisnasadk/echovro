package com.echovro.echovro.config;

import com.echovro.echovro.model.User;
import com.echovro.echovro.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            createSeedUser("elena_v", "elena@echovro.com", "female", "female_avatar_1", "spotify", "city", "Midnight City – M83",
                    List.of(List.of("Midnight City", "M83"), List.of("Blinding Lights", "The Weeknd"), List.of("After Hours", "The Weeknd"), List.of("Starboy", "The Weeknd")));

            createSeedUser("kai.synth", "kai@echovro.com", "male", "male_avatar_2", "ytm", "city", "Nightcall – Kavinsky",
                    List.of(List.of("Nightcall", "Kavinsky"), List.of("Instant Crush", "Daft Punk"), List.of("Genesis", "Justice"), List.of("Resonance", "HOME")));

            createSeedUser("maya_acoustic", "maya@echovro.com", "female", "female_avatar_2", "spotify", "cafe", "Coffee – beabadoobee",
                    List.of(List.of("Coffee", "beabadoobee"), List.of("Sunday Best", "Surfaces"), List.of("Riptide", "Vance Joy"), List.of("Banana Pancakes", "Jack Johnson")));

            createSeedUser("leo.notes", "leo@echovro.com", "male", "male_avatar_1", "gaana", "cafe", "Banana Pancakes – Jack Johnson",
                    List.of(List.of("Banana Pancakes", "Jack Johnson"), List.of("Put Your Records On", "Corinne Bailey Rae"), List.of("Beyond", "Leon Bridges"), List.of("Sunday Best", "Surfaces")));

            createSeedUser("nova_dream", "nova@echovro.com", "female", "female_avatar_3", "spotify", "gallery", "Space Song – Beach House",
                    List.of(List.of("Space Song", "Beach House"), List.of("Apocalypse", "Cigarettes After Sex"), List.of("Resonance", "HOME"), List.of("Sunsetz", "Cigarettes After Sex")));

            createSeedUser("sam.ambient", "sam@echovro.com", "male", "male_avatar_3", "ytm", "gallery", "Chamber of Reflection – Mac DeMarco",
                    List.of(List.of("Chamber of Reflection", "Mac DeMarco"), List.of("Sunsetz", "Cigarettes After Sex"), List.of("Ylang Ylang", "FKJ"), List.of("Space Song", "Beach House")));
        }
    }

    private void createSeedUser(String username, String email, String gender, String avatar, String musicService, String place, String currentSong, List<List<String>> tracks) {
        try {
            User u = new User();
            u.setName(username);
            u.setEmail(email);
            u.setPassword(passwordEncoder.encode("Password123"));
            u.setGender(gender);
            u.setAvatar(avatar);
            u.setMusicService(musicService);
            u.setCurrentPlace(place);
            u.setCurrentSong(currentSong);
            u.setTracksJson(objectMapper.writeValueAsString(tracks));
            u.setCreatedAt(LocalDateTime.now());
            u.setLastActive(LocalDateTime.now());
            userRepository.save(u);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
