package org.example.search.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
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
                                Микросервис для расширенного поиска и фильтрации задач в системе Smart-Task.
                                
                                ## Основные возможности:
                                - Расширенный поиск задач по различным критериям
                                - Фильтрация по статусу, приоритету, дедлайну
                                - Поиск по ключевым словам
                                - Сортировка и пагинация результатов
                                - Комбинированные фильтры
                                """)
                        .version("1.0.0")
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8085")
                                .description("Search Service (Direct)"),
                        new Server()
                                .url("http://localhost:8099/api/search")
                                .description("API Gateway")
                ));
    }
}