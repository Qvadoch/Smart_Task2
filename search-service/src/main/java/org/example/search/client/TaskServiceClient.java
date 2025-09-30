package org.example.search.client;

import org.example.search.model.Task;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(
        name = "task-service",
        contextId = "taskServiceClient",
        path = "/api/tasks"
)
public interface TaskServiceClient {

    @GetMapping
    List<Task> getTasksByUser(@RequestParam Long userId);

    @GetMapping("/{id}")
    Task getTaskById(@PathVariable Long id, @RequestParam Long userId);
}