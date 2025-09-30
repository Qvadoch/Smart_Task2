package org.example.search.service;

import lombok.extern.slf4j.Slf4j;
import org.example.search.dto.SearchCriteria;
import org.example.search.model.Task;
import org.example.search.repository.TaskSearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.circuitbreaker.CircuitBreaker;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@Transactional
public class TaskSearchService {

    @Autowired
    private TaskSearchRepository taskSearchRepository;

    @Autowired
    private CircuitBreakerFactory circuitBreakerFactory;

    public Page<Task> searchTasks(SearchCriteria criteria) {
        CircuitBreaker circuitBreaker = circuitBreakerFactory.create("searchService");

        return circuitBreaker.run(() -> {
            log.info("Searching tasks with criteria: userId={}, keyword={}, status={}, priority={}",
                    criteria.getUserId(), criteria.getKeyword(), criteria.getStatus(), criteria.getPriority());

            Specification<Task> spec = buildSpecification(criteria);
            Pageable pageable = buildPageable(criteria);

            return taskSearchRepository.findAll(spec, pageable);
        }, throwable -> {
            log.error("Fallback for search: {}", throwable.getMessage());
            return Page.empty();
        });
    }

    public List<Task> searchTasksWithoutPagination(SearchCriteria criteria) {
        CircuitBreaker circuitBreaker = circuitBreakerFactory.create("searchService");

        return circuitBreaker.run(() -> {
            log.info("Searching tasks without pagination: userId={}", criteria.getUserId());

            Specification<Task> spec = buildSpecification(criteria);
            Sort sort = buildSort(criteria);

            return taskSearchRepository.findAll(spec, sort);
        }, throwable -> {
            log.error("Fallback for search without pagination: {}", throwable.getMessage());
            return List.of();
        });
    }

    public List<Task> findByUserId(Long userId) {
        log.info("Finding all tasks for user: {}", userId);
        return taskSearchRepository.findByUserId(userId);
    }

    public Page<Task> findByUserIdWithPagination(Long userId, Integer page, Integer size) {
        log.info("Finding tasks for user: {} with pagination: page={}, size={}", userId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return taskSearchRepository.findByUserId(userId, pageable);
    }

    public List<Task> findByKeyword(Long userId, String keyword) {
        log.info("Searching tasks for user: {} with keyword: {}", userId, keyword);
        return taskSearchRepository.findByUserIdAndKeyword(userId, keyword);
    }

    public List<Task> findByStatus(Long userId, String status) {
        log.info("Searching tasks for user: {} with status: {}", userId, status);
        return taskSearchRepository.findByUserIdAndStatus(userId,
                org.example.search.model.TaskStatus.valueOf(status.toUpperCase()));
    }

    public List<Task> findByPriority(Long userId, String priority) {
        log.info("Searching tasks for user: {} with priority: {}", userId, priority);
        return taskSearchRepository.findByUserIdAndPriority(userId,
                org.example.search.model.Priority.valueOf(priority.toUpperCase()));
    }

    public Optional<Task> findByIdAndUserId(Long id, Long userId) {
        log.info("Finding task by id: {} for user: {}", id, userId);
        return taskSearchRepository.findById(id)
                .filter(task -> task.getUserId().equals(userId));
    }

    private Specification<Task> buildSpecification(SearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Фильтр по пользователю
            predicates.add(cb.equal(root.get("userId"), criteria.getUserId()));

            // Фильтр по ключевому слову
            if (criteria.getKeyword() != null && !criteria.getKeyword().trim().isEmpty()) {
                String keywordPattern = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate titlePredicate = cb.like(cb.lower(root.get("title")), keywordPattern);
                Predicate descriptionPredicate = cb.like(cb.lower(root.get("description")), keywordPattern);
                predicates.add(cb.or(titlePredicate, descriptionPredicate));
            }

            // Фильтр по статусу
            if (criteria.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.getStatus()));
            }

            // Фильтр по приоритету
            if (criteria.getPriority() != null) {
                predicates.add(cb.equal(root.get("priority"), criteria.getPriority()));
            }

            // Фильтр по дедлайну
            if (criteria.getDeadlineFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("deadline"), criteria.getDeadlineFrom()));
            }
            if (criteria.getDeadlineTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("deadline"), criteria.getDeadlineTo()));
            }

            // Фильтр по дате создания
            if (criteria.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.getCreatedFrom()));
            }
            if (criteria.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.getCreatedTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Pageable buildPageable(SearchCriteria criteria) {
        Sort sort = buildSort(criteria);
        return PageRequest.of(criteria.getPage(), criteria.getSize(), sort);
    }

    private Sort buildSort(SearchCriteria criteria) {
        Sort.Direction direction = Sort.Direction.fromString(criteria.getSortDirection());
        return Sort.by(direction, criteria.getSortBy());
    }
}