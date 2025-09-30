package org.example.search.repository;

import org.example.search.model.Task;
import org.example.search.model.TaskStatus;
import org.example.search.model.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskSearchRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    // Базовые методы поиска
    List<Task> findByUserId(Long userId);
    Page<Task> findByUserId(Long userId, Pageable pageable);

    // Поиск по статусу
    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);

    // Поиск по приоритету
    List<Task> findByUserIdAndPriority(Long userId, Priority priority);

    // Поиск по ключевым словам в названии и описании
    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Task> findByUserIdAndKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);
}