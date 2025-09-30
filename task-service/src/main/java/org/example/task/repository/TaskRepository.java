package org.example.task.repository;

import org.example.task.model.Task;
import org.example.task.model.TaskStatus;
import org.example.task.model.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Найти все задачи пользователя
    List<Task> findByUserId(Long userId);

    // Найти задачу по ID и пользователю (для проверки владения)
    Optional<Task> findByIdAndUserId(Long id, Long userId);

    // Проверить существование задачи у пользователя
    boolean existsByIdAndUserId(Long id, Long userId);

    // Удалить задачу по ID и пользователю
    void deleteByIdAndUserId(Long id, Long userId);

}