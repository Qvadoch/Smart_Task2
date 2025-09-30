package org.example.search.config;

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
                        .title("Search Service API")
                        .description("""
                                Микросервис для расширенного поиска, фильтрации и сортировки задач в системе Smart-Task.
                                
                                ## Основные возможности:
                                - Расширенный поиск задач по различным критериям
                                - Фильтрация по статусу, приоритету, дедлайну
                                - Поиск по ключевым словам в названии и описании
                                - Сортировка по различным полям
                                - Пагинация результатов
                                - Комбинированные фильтры
                                
                                ## Технологии:
                                - Spring Boot 3.5.6
                                - Spring Data JPA с Specification API
                                - PostgreSQL
                                - Resilience4j Circuit Breaker
                                - Eureka Client
                                - Swagger/OpenAPI 3.0
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Smart-Task Team")
                                .email("search-service@smart-task.com")
                                .url("https://smart-task.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8083/search-service")
                                .description("Local Development Server"),
                        new Server()
                                .url("http://localhost:8080/api/search")
                                .description("API Gateway (через Eureka)"),
                        new Server()
                                .url("http://search-service:8083")
                                .description("Docker Container Server")
                ))
                .tags(List.of(
                        new Tag()
                                .name("Search")
                                .description("API для расширенного поиска задач"),
                        new Tag()
                                .name("Filter")
                                .description("API для фильтрации задач"),
                        new Tag()
                                .name("Health")
                                .description("Эндпоинты мониторинга и здоровья сервиса")
                ));
    }
}