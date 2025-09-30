package org.example.search.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.extern.slf4j.Slf4j;
import org.example.search.dto.SearchCriteria;
import org.example.search.model.Task;
import org.example.search.service.TaskDataSyncService;
import org.example.search.service.TaskSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/search")
@Tag(name = "Search", description = "API для поиска, фильтрации и сортировки задач")
@Slf4j
public class SearchController {

    @Autowired
    private TaskSearchService taskSearchService;

    @Autowired
    private TaskDataSyncService taskDataSyncService;

    @Operation(summary = "Расширенный поиск задач", description = "Поиск задач с фильтрацией, пагинацией и сортировкой")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Поиск выполнен успешно"),
            @ApiResponse(responseCode = "400", description = "Неверные параметры запроса")
    })
    @PostMapping("/advanced")
    public ResponseEntity<Page<Task>> advancedSearch(
            @Parameter(description = "Критерии поиска", required = true)
            @Valid @RequestBody SearchCriteria criteria) {
        log.info("Advanced search request: {}", criteria);

        // Синхронизируем данные перед поиском
        taskDataSyncService.syncUserTasks(criteria.getUserId());

        Page<Task> result = taskSearchService.searchTasks(criteria);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Поиск задач без пагинации", description = "Поиск задач с фильтрацией и сортировкой без пагинации")
    @PostMapping("/simple")
    public ResponseEntity<List<Task>> simpleSearch(
            @Parameter(description = "Критерии поиска", required = true)
            @Valid @RequestBody SearchCriteria criteria) {
        log.info("Simple search request: {}", criteria);

        // Синхронизируем данные перед поиском
        taskDataSyncService.syncUserTasks(criteria.getUserId());

        List<Task> result = taskSearchService.searchTasksWithoutPagination(criteria);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Синхронизировать задачи пользователя", description = "Принудительная синхронизация задач из основного сервиса")
    @PostMapping("/sync/{userId}")
    public ResponseEntity<String> syncUserTasks(
            @Parameter(description = "ID пользователя", required = true)
            @PathVariable Long userId) {
        log.info("Manual sync requested for user: {}", userId);
        taskDataSyncService.syncUserTasks(userId);
        return ResponseEntity.ok("Sync completed for user: " + userId);
    }

    @Operation(summary = "Получить все задачи пользователя", description = "Возвращает все задачи пользователя")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getUserTasks(
            @Parameter(description = "ID пользователя", required = true)
            @PathVariable Long userId) {
        log.info("Get all tasks for user: {}", userId);

        // Синхронизируем перед получением
        taskDataSyncService.syncUserTasks(userId);

        List<Task> tasks = taskSearchService.findByUserId(userId);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Получить задачи пользователя с пагинацией", description = "Возвращает задачи пользователя с пагинацией")
    @GetMapping("/user/{userId}/page")
    public ResponseEntity<Page<Task>> getUserTasksWithPagination(
            @Parameter(description = "ID пользователя", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Номер страницы", example = "0")
            @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "Размер страницы", example = "20")
            @RequestParam(defaultValue = "20") Integer size) {
        log.info("Get tasks for user: {} with pagination: page={}, size={}", userId, page, size);

        taskDataSyncService.syncUserTasks(userId);

        Page<Task> tasks = taskSearchService.findByUserIdWithPagination(userId, page, size);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Поиск по ключевому слову", description = "Поиск задач по ключевому слову в названии и описании")
    @GetMapping("/user/{userId}/keyword")
    public ResponseEntity<List<Task>> searchByKeyword(
            @Parameter(description = "ID пользователя", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Ключевое слово для поиска", required = true)
            @RequestParam String keyword) {
        log.info("Search by keyword: userId={}, keyword={}", userId, keyword);

        taskDataSyncService.syncUserTasks(userId);

        List<Task> tasks = taskSearchService.findByKeyword(userId, keyword);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Фильтр по статусу", description = "Фильтрация задач по статусу")
    @GetMapping("/user/{userId}/status")
    public ResponseEntity<List<Task>> filterByStatus(
            @Parameter(description = "ID пользователя", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Статус задачи", required = true, example = "IN_PROGRESS")
            @RequestParam String status) {
        log.info("Filter by status: userId={}, status={}", userId, status);

        taskDataSyncService.syncUserTasks(userId);

        List<Task> tasks = taskSearchService.findByStatus(userId, status);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Фильтр по приоритету", description = "Фильтрация задач по приоритету")
    @GetMapping("/user/{userId}/priority")
    public ResponseEntity<List<Task>> filterByPriority(
            @Parameter(description = "ID пользователя", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Приоритет задачи", required = true, example = "HIGH")
            @RequestParam String priority) {
        log.info("Filter by priority: userId={}, priority={}", userId, priority);

        taskDataSyncService.syncUserTasks(userId);

        List<Task> tasks = taskSearchService.findByPriority(userId, priority);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Получить задачу по ID", description = "Возвращает задачу по ID для указанного пользователя")
    @GetMapping("/user/{userId}/task/{taskId}")
    public ResponseEntity<Task> getTaskById(
            @Parameter(description = "ID пользователя", required = true)
            @PathVariable Long userId,
            @Parameter(description = "ID задачи", required = true)
            @PathVariable Long taskId) {
        log.info("Get task by id: userId={}, taskId={}", userId, taskId);

        taskDataSyncService.syncUserTasks(userId);

        return taskSearchService.findByIdAndUserId(taskId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Проверка здоровья сервиса", description = "Эндпоинт для проверки работы сервиса")
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Search Service is healthy");
    }
}