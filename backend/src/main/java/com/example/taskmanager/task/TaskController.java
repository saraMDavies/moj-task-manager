package com.example.taskmanager.task;

import com.example.taskmanager.generated.model.Task;
import com.example.taskmanager.generated.model.TaskRequest;
import com.example.taskmanager.generated.model.TaskStatus;
import com.example.taskmanager.generated.model.UpdateTaskStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:3000")
public class TaskController {
    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public List<Task> all() {
        return taskRepository.findAll().stream().map(this::toModel).toList();
    }

    @GetMapping("/{id}")
    public Task one(@PathVariable Long id) {
        return toModel(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@Valid @RequestBody TaskRequest request) {
        TaskEntity entity = new TaskEntity();
        apply(entity, request);
        return toModel(taskRepository.save(entity));
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        TaskEntity entity = find(id);
        apply(entity, request);
        return toModel(taskRepository.save(entity));
    }

    @PatchMapping("/{id}/status")
    public Task status(@PathVariable Long id, @Valid @RequestBody UpdateTaskStatusRequest request) {
        TaskEntity entity = find(id);
        entity.setStatus(toEntityStatus(request.getStatus()));
        return toModel(taskRepository.save(entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taskRepository.delete(find(id));
    }

    private TaskEntity find(Long id) {
        return taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
    }

    private void apply(TaskEntity entity, TaskRequest request) {
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setStatus(toEntityStatus(request.getStatus()));
        entity.setDue(request.getDue());
    }

    private TaskEntity.Status toEntityStatus(TaskStatus status) {
        return TaskEntity.Status.valueOf(status.getValue());
    }

    private Task toModel(TaskEntity entity) {
        return new Task()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .status(TaskStatus.fromValue(entity.getStatus().name()))
                .due(entity.getDue());
    }
}
