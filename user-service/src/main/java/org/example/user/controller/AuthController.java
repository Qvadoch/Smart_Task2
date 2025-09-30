package org.example.user.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.user.model.User;
import org.example.user.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "API для регистрации и авторизации пользователей")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Регистрация пользователя", description = "Создает нового пользователя в системе")
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            log.info("Попытка регистрации: username={}, email={}", user.getUsername(), user.getEmail());
            Map<String, Object> response = authService.register(user.getUsername(), user.getEmail(), user.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Ошибка регистрации: {}", e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @Operation(summary = "Авторизация пользователя", description = "Выполняет вход пользователя в систему")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        try {
            log.info("Попытка входа: email={}", loginRequest.getEmail());
            Map<String, Object> response = authService.login(loginRequest.getEmail(), loginRequest.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Ошибка входа: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", "Неверный email или пароль"));
        }
    }

    @Operation(summary = "Валидация токена", description = "Проверяет валидность JWT токена")
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                // Валидация происходит в фильтре, здесь просто возвращаем успех
                return ResponseEntity.ok(Map.of("valid", true, "message", "Token is valid"));
            }
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Invalid token format"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Token validation failed"));
        }
    }
}