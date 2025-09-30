package org.example.search.service;

import lombok.extern.slf4j.Slf4j;
import org.example.search.client.TaskServiceClient;
import org.example.search.model.Task;
import org.example.search.repository.TaskSearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class TaskDataSyncService {

    @Autowired
    private TaskServiceClient taskServiceClient;

    @Autowired
    private TaskSearchRepository taskSearchRepository;

    /**
     * Синхронизирует задачи для конкретного пользователя
     */
    @Transactional
    public void syncUserTasks(Long userId) {
        try {
            log.info("Starting sync for user: {}", userId);

            // Получаем задачи из task-service
            List<Task> tasksFromTaskService = taskServiceClient.getTasksByUser(userId);

            // Удаляем старые задачи пользователя
            List<Task> existingTasks = taskSearchRepository.findByUserId(userId);
            taskSearchRepository.deleteAll(existingTasks);

            // Сохраняем новые задачи
            if (!tasksFromTaskService.isEmpty()) {
                taskSearchRepository.saveAll(tasksFromTaskService);
                log.info("Synced {} tasks for user: {}", tasksFromTaskService.size(), userId);
            } else {
                log.info("No tasks found for user: {}", userId);
            }

        } catch (Exception e) {
            log.error("Error syncing tasks for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Периодическая синхронизация (каждые 5 минут)
     */
    @Scheduled(fixedRate = 300000) // 5 минут
    public void scheduledSync() {
        log.info("Starting scheduled sync...");
        // Здесь можно добавить логику для синхронизации всех пользователей
        // или только активных пользователей
    }
}