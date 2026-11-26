package com.example.taskmanager.task;

import com.example.taskmanager.generated.api.TasksApi;
import com.example.taskmanager.generated.model.Task;
import com.example.taskmanager.generated.model.TaskRequest;
import com.example.taskmanager.generated.model.TaskStatus;
import com.example.taskmanager.generated.model.UpdateTaskStatusRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class TaskController implements TasksApi {
    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    public ResponseEntity<List<Task>> getTasks() {
        return ResponseEntity.ok(taskRepository.findAll(Sort.by("due")).stream().map(this::toModel).toList());
    }

    @Override
    public ResponseEntity<Task> getTask(Long id) {
        return ResponseEntity.ok(toModel(find(id)));
    }

    @Override
    public ResponseEntity<Task> createTask(TaskRequest taskRequest) {
        TaskEntity entity = new TaskEntity();
        apply(entity, taskRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(toModel(taskRepository.save(entity)));
    }

    @Override
    public ResponseEntity<Task> updateTask(Long id, TaskRequest taskRequest) {
        TaskEntity entity = find(id);
        apply(entity, taskRequest);
        return ResponseEntity.ok(toModel(taskRepository.save(entity)));
    }

    @Override
    public ResponseEntity<Task> updateTaskStatus(Long id, UpdateTaskStatusRequest updateTaskStatusRequest) {
        TaskEntity entity = find(id);
        entity.setStatus(toEntityStatus(updateTaskStatusRequest.getStatus()));
        return ResponseEntity.ok(toModel(taskRepository.save(entity)));
    }

    @Override
    public ResponseEntity<Void> deleteTask(Long id) {
        taskRepository.delete(find(id));
        return ResponseEntity.noContent().build();
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
