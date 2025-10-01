// FallbackController.java
package org.example.gateway.fallback;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class FallbackController {

    @RequestMapping("/fallback/task-service")
    public Mono<ResponseEntity<Map<String, Object>>> taskServiceFallback() {
        return Mono.fromSupplier(() -> {
            Map<String, Object> fallbackResponse = new HashMap<>();
            fallbackResponse.put("status", "SERVICE_UNAVAILABLE");
            fallbackResponse.put("message", "Task Service is temporarily unavailable. Please try again later.");
            fallbackResponse.put("timestamp", LocalDateTime.now().toString());
            fallbackResponse.put("service", "task-service");

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(fallbackResponse);
        });
    }

    @RequestMapping("/fallback/user-service")
    public Mono<ResponseEntity<Map<String, Object>>> userServiceFallback() {
        return Mono.fromSupplier(() -> {
            Map<String, Object> fallbackResponse = new HashMap<>();
            fallbackResponse.put("status", "SERVICE_UNAVAILABLE");
            fallbackResponse.put("message", "User Service is temporarily unavailable. Please try again later.");
            fallbackResponse.put("timestamp", LocalDateTime.now().toString());
            fallbackResponse.put("service", "user-service");

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(fallbackResponse);
        });
    }

    @RequestMapping("/fallback/default")
    public Mono<ResponseEntity<Map<String, Object>>> defaultFallback() {
        return Mono.fromSupplier(() -> {
            Map<String, Object> fallbackResponse = new HashMap<>();
            fallbackResponse.put("status", "SERVICE_UNAVAILABLE");
            fallbackResponse.put("message", "Service is temporarily unavailable.");
            fallbackResponse.put("timestamp", LocalDateTime.now().toString());

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(fallbackResponse);
        });
    }

    @RequestMapping("/fallback/search-service")
    public Mono<ResponseEntity<Map<String, Object>>> searchServiceFallback() {
        return Mono.fromSupplier(() -> {
            Map<String, Object> fallbackResponse = new HashMap<>();
            fallbackResponse.put("status", "SERVICE_UNAVAILABLE");
            fallbackResponse.put("message", "Search Service is temporarily unavailable. Please try again later.");
            fallbackResponse.put("timestamp", LocalDateTime.now().toString());
            fallbackResponse.put("service", "search-service");
            fallbackResponse.put("suggestion", "Try using basic search filters or contact support");

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(fallbackResponse);
        });
    }
}