package org.example.task.controller;

import org.example.task.model.Task;
import org.example.task.model.TaskStatus;
import org.example.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks", description = "API для управления задачами")
public class TaskController {

    private static final Logger log = LoggerFactory.getLogger(TaskController.class);
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @Operation(summary = "Создать задачу", description = "Создает новую задачу")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Задача успешно создана"),
            @ApiResponse(responseCode = "400", description = "Неверные параметры запроса")
    })
    @PostMapping
    public Task createTask(@Valid @RequestBody Task task) {
        log.info("Создание новой задачи: title={}, userId={}", task.getTitle(), task.getUserId());
        return taskService.createTask(task);
    }

    @Operation(summary = "Получить все задачи пользователя", description = "Возвращает список всех задач для указанного пользователя")
    @GetMapping
    public List<Task> getAllTasksByUser(@RequestParam Long userId) {
        log.info("Запрос всех задач для пользователя: userId={}", userId);
        return taskService.getAllTasksByUser(userId);
    }

    @Operation(summary = "Получить задачу по ID", description = "Возвращает задачу по её идентификатору")
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id, @RequestParam Long userId) {
        log.info("Запрос задачи по id={} для пользователя userId={}", id, userId);
        return taskService.getTaskById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Обновить задачу", description = "Обновляет данные задачи")
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestParam Long userId, @Valid @RequestBody Task updatedTask) {
        log.info("Обновление задачи id={} для пользователя userId={}", id, userId);
        return taskService.updateTask(id, userId, updatedTask)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Обновить статус задачи", description = "Изменяет статус задачи")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateTaskStatus(@PathVariable Long id, @RequestParam Long userId, @RequestParam TaskStatus status) {
        log.info("Обновление статуса задачи id={} на status={} для пользователя userId={}", id, status, userId);
        return taskService.updateTaskStatus(id, userId, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Удалить задачу", description = "Удаляет задачу")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(@PathVariable Long id, @RequestParam Long userId) {
        log.info("Удаление задачи id={} для пользователя userId={}", id, userId);
        if (taskService.deleteTask(id, userId)) {
            return ResponseEntity.ok("Task " + id + " deleted successfully");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}