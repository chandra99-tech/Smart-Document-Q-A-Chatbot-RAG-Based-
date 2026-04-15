package com.docqa.service;

import com.docqa.model.User;
import com.docqa.repository.UserRepository;
import com.docqa.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, Object> register(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use.");
        }
        User user = User.builder()
            .name(name)
            .email(email)
            .password(passwordEncoder.encode(password))
            .build();
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return buildResponse(user, token);
    }

    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return buildResponse(user, token);
    }

    private Map<String, Object> buildResponse(User user, String token) {
        return Map.of(
            "token", token,
            "user", Map.of(
                "id",    user.getId(),
                "name",  user.getName(),
                "email", user.getEmail()
            )
        );
    }
}
