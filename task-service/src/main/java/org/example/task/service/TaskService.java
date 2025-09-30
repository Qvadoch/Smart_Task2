package org.example.task.service;

import lombok.extern.slf4j.Slf4j;
import org.example.task.model.Task;
import org.example.task.model.TaskStatus;
import org.example.task.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.circuitbreaker.CircuitBreaker;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@Transactional
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CircuitBreakerFactory circuitBreakerFactory;

    public List<Task> getAllTasksByUser(Long userId) {
        CircuitBreaker circuitBreaker = circuitBreakerFactory.create("taskService");
        return circuitBreaker.run(() -> {
            log.info("Getting all tasks for user: {}", userId);
            return taskRepository.findByUserId(userId);
        }, throwable -> {
            log.error("Fallback for user {}: {}", userId, throwable.getMessage());
            return Collections.emptyList();
        });
    }

    public Optional<Task> getTaskById(Long id, Long userId) {
        log.info("Getting task by ID: {} for user: {}", id, userId);
        return taskRepository.findByIdAndUserId(id, userId);
    }

    public Task createTask(Task task) {
        log.info("Creating task for user: {}", task.getUserId());
        return taskRepository.save(task);
    }

    public Optional<Task> updateTask(Long id, Long userId, Task updatedTask) {
        log.info("Updating task ID: {} for user: {}", id, userId);
        return taskRepository.findByIdAndUserId(id, userId)
                .map(existingTask -> {
                    existingTask.setTitle(updatedTask.getTitle());
                    existingTask.setDescription(updatedTask.getDescription());
                    existingTask.setStatus(updatedTask.getStatus());
                    existingTask.setPriority(updatedTask.getPriority());
                    existingTask.setDeadline(updatedTask.getDeadline());
                    return taskRepository.save(existingTask);
                });
    }

    public Optional<Task> updateTaskStatus(Long id, Long userId, TaskStatus status) {
        log.info("Updating status for task ID: {} to: {} for user: {}", id, status, userId);
        return taskRepository.findByIdAndUserId(id, userId)
                .map(task -> {
                    task.setStatus(status);
                    return taskRepository.save(task);
                });
    }

    public boolean deleteTask(Long id, Long userId) {
        log.info("Deleting task ID: {} for user: {}", id, userId);
        if (taskRepository.existsByIdAndUserId(id, userId)) {
            taskRepository.deleteByIdAndUserId(id, userId);
            return true;
        }
        return false;
    }
}