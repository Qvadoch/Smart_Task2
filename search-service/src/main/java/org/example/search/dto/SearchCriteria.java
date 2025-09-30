package org.example.search.dto;

import org.example.search.model.Priority;
import org.example.search.model.TaskStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SearchCriteria {
    private Long userId;
    private String keyword;
    private TaskStatus status;
    private Priority priority;
    private LocalDateTime deadlineFrom;
    private LocalDateTime deadlineTo;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
    private Integer page = 0;
    private Integer size = 20;
}