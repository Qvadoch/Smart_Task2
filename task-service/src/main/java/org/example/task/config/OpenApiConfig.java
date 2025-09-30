package org.example.task.config;

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
                        .title("Task Service API")
                        .description("""
                                Микросервис для управления задачами в системе Smart-Task.
                                
                                ## Основные возможности:
                                - Полный набор CRUD операций для задач
                                - Фильтрация и поиск задач по различным критериям
                                - Управление статусами задач
                                - Назначение задач пользователям
                                - Приоритизация задач
                                - Установка сроков выполнения
                                - Вложенность задач (подзадачи)
                                - Теги и категории задач
                                
                                ## Технологии:
                                - Spring Boot 3.5.6
                                - Spring Data JPA
                                - PostgreSQL
                                - Redis для кэширования
                                - Resilience4j Circuit Breaker
                                - Eureka Client
                                - OpenFeign для межсервисного взаимодействия
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Smart-Task Team")
                                .email("task-service@smart-task.com")
                                .url("https://smart-task.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8081/task-service")
                                .description("Local Development Server"),
                        new Server()
                                .url("http://localhost:8080/task-service")
                                .description("API Gateway (через Eureka)"),
                        new Server()
                                .url("http://task-service:8081")
                                .description("D Container Server")
                ))
                .tags(List.of(
                        new Tag()
                                .name("Tasks")
                                .description("API для управления задачами (CRUD операции)"),
                        new Tag()
                                .name("Status")
                                .description("API для управления статусами задач"),
                        new Tag()
                                .name("Filter")
                                .description("API для фильтрации и поиска задач"),
                        new Tag()
                                .name("Assignment")
                                .description("API для назначения задач пользователям"),
                        new Tag()
                                .name("Health")
                                .description("Эндпоинты мониторинга и здоровья сервиса (Spring Actuator)")
                ));
    }
}