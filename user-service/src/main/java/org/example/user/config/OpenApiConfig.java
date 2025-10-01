package org.example.user.config;

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
                        .title("User Service API")
                        .description("""
                                Микросервис для управления пользователями и аутентификации в системе Smart-Task.
                                
                                ## Основные возможности:
                                - Регистрация новых пользователей
                                - Авторизация и аутентификация
                                - Управление профилями пользователей
                                - JWT токены
                                - Безопасное хеширование паролей
                                """)
                        .version("1.0.0")
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8087")
                                .description("User Service (Direct)"),
                        new Server()
                                .url("http://localhost:8099")
                                .description("API Gateway")
                ));
    }
}