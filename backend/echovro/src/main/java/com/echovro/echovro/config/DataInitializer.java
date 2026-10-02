package com.echovro.echovro.config;

import com.echovro.echovro.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        String[] mockEmails = {
            "elena@echovro.com", "kai@echovro.com", "maya@echovro.com",
            "leo@echovro.com", "nova@echovro.com", "sam@echovro.com"
        };
        for (String email : mockEmails) {
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }
}
