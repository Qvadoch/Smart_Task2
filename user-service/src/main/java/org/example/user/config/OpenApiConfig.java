package org.example.user.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("User Service API")
                        .description("""
                                Микросервис для управления пользователями и аутентификации в системе Smart-Task.
                                
                                ## Основные возможности:
                                - Регистрация новых пользователей
                                - Авторизация (вход в систему)
                                - Управление профилями пользователей (CRUD операции)
                                - Валидация данных
                                - Хеширование паролей (BCrypt)
                                - Circuit Breaker для отказоустойчивости
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Smart-Task Team")
                                .email("user-service@smart-task.com")
                                .url("https://smart-task.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8087/user-service")
                                .description("Local Development Server"),
                        new Server()
                                .url("http://localhost:8080/user-service")
                                .description("API Gateway (через Eureka)")
                ))
                .tags(List.of(
                        new Tag()
                                .name("Authentication")
                                .description("API для регистрации и авторизации пользователей"),
                        new Tag()
                                .name("Users")
                                .description("API для управления пользователями (CRUD операции)"),
                        new Tag()
                                .name("Health")
                                .description("Эндпоинты мониторинга и здоровья сервиса (Spring Actuator)")
                ));
    }
}