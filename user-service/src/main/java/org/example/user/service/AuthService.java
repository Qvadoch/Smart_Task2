package org.example.user.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.example.user.model.User;
import org.example.user.repository.UserRepository;
import org.example.user.util.JwtUtil;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final CircuitBreakerFactory circuitBreakerFactory;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       BCryptPasswordEncoder passwordEncoder,
                       CircuitBreakerFactory circuitBreakerFactory,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.circuitBreakerFactory = circuitBreakerFactory;
        this.jwtUtil = jwtUtil;
    }

    @CircuitBreaker(name = "userService", fallbackMethod = "fallbackRegister")
    public Map<String, Object> register(String username, String email, String password) {
        log.info("Attempting to register user: username={}, email={}", username, email);

        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("Registration failed: Email {} already exists", email);
            throw new RuntimeException("Пользователь с таким email уже существует");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            log.warn("Registration failed: Username {} already exists", username);
            throw new RuntimeException("Пользователь с таким никнеймом уже существует");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());

        log.info("User registered successfully: id={}, username={}", savedUser.getId(), savedUser.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("user", savedUser);
        response.put("token", token);

        return response;
    }

    @CircuitBreaker(name = "userService", fallbackMethod = "fallbackLogin")
    public Map<String, Object> login(String email, String password) {
        log.info("Attempting login for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login failed: Email {} not found", email);
                    return new RuntimeException("Неверный email или пароль");
                });

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Login failed: Invalid password for email {}", email);
            throw new RuntimeException("Неверный email или пароль");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        log.info("Login successful: username={}", user.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("token", token);

        return response;
    }

    // Fallback methods
    public Map<String, Object> fallbackRegister(String username, String email, String password, Throwable t) {
        log.error("Fallback for register: {}", t.getMessage());
        throw new RuntimeException("Сервис временно недоступен. Попробуйте позже.");
    }

    public Map<String, Object> fallbackLogin(String email, String password, Throwable t) {
        log.error("Fallback for login: {}", t.getMessage());
        throw new RuntimeException("Сервис временно недоступен. Попробуйте позже.");
    }
}