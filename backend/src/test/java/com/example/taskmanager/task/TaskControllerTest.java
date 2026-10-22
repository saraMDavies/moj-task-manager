package com.example.taskmanager.task;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    private static final String DUE = "2026-10-23T08:00:00Z";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskRepository taskRepository;

    @Test
    void listReturnsAllTasks() throws Exception {
        when(taskRepository.findAll()).thenReturn(List.of(
                entity(1L, "First", TaskEntity.Status.TODO),
                entity(2L, "Second", TaskEntity.Status.DONE)));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("First"))
                .andExpect(jsonPath("$[1].status").value("DONE"));
    }

    @Test
    void getReturnsEveryFieldMapped() throws Exception {
        TaskEntity entity = entity(7L, "Call client", TaskEntity.Status.IN_PROGRESS);
        entity.setDescription("Ring back about the form");
        entity.setDue(OffsetDateTime.parse(DUE));
        when(taskRepository.findById(7L)).thenReturn(Optional.of(entity));

        mockMvc.perform(get("/api/tasks/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.title").value("Call client"))
                .andExpect(jsonPath("$.description").value("Ring back about the form"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.due").value(DUE));
    }

    @Test
    void createReturnsCreatedTask() throws Exception {
        when(taskRepository.save(any())).thenAnswer(invocation -> {
            TaskEntity saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 3L);
            return saved;
        });

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"New task\",\"description\":\"Details\",\"status\":\"TODO\",\"due\":\"" + DUE + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.title").value("New task"))
                .andExpect(jsonPath("$.description").value("Details"))
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.due").value(DUE));
    }

    @Test
    void updateReplacesEveryField() throws Exception {
        TaskEntity entity = entity(4L, "Old title", TaskEntity.Status.TODO);
        entity.setDescription("Old description");
        when(taskRepository.findById(4L)).thenReturn(Optional.of(entity));
        when(taskRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/tasks/4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"New title\",\"status\":\"DONE\",\"due\":\"" + DUE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.title").value("New title"))
                .andExpect(jsonPath("$.description").doesNotExist())
                .andExpect(jsonPath("$.status").value("DONE"));
    }

    @Test
    void patchChangesOnlyStatus() throws Exception {
        TaskEntity entity = entity(5L, "Keep me", TaskEntity.Status.TODO);
        entity.setDescription("Keep this too");
        when(taskRepository.findById(5L)).thenReturn(Optional.of(entity));
        when(taskRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(patch("/api/tasks/5/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Keep me"))
                .andExpect(jsonPath("$.description").value("Keep this too"))
                .andExpect(jsonPath("$.status").value("DONE"));
    }

    @Test
    void deleteReturnsNoContentAndRemovesTask() throws Exception {
        TaskEntity entity = entity(6L, "Gone", TaskEntity.Status.DONE);
        when(taskRepository.findById(6L)).thenReturn(Optional.of(entity));

        mockMvc.perform(delete("/api/tasks/6"))
                .andExpect(status().isNoContent());

        verify(taskRepository).delete(entity);
    }

    @Test
    void deleteUnknownTaskReturnsNotFound() throws Exception {
        when(taskRepository.findById(anyLong())).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/tasks/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Task 99 not found"));
    }

    @Test
    void unknownTaskReturnsNotFoundWithErrorBody() throws Exception {
        when(taskRepository.findById(anyLong())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/tasks/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Task 99 not found"));
    }

    @Test
    void blankTitleReturnsBadRequestWithErrorBody() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"status\":\"TODO\",\"due\":\"" + DUE + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("title size must be between 1 and 50"));
    }

    @Test
    void titleOverFiftyCharactersReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + "x".repeat(51) + "\",\"status\":\"TODO\",\"due\":\"" + DUE + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("title size must be between 1 and 50"));
    }

    @Test
    void descriptionOverTwoHundredAndFiftyFiveCharactersReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Fine\",\"description\":\"" + "x".repeat(256) + "\",\"status\":\"TODO\",\"due\":\"" + DUE + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("description size must be between 0 and 255"));
    }

    @Test
    void missingStatusReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"No status\",\"due\":\"" + DUE + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("status must not be null"));
    }

    @Test
    void missingDueReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"No due date\",\"status\":\"TODO\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("due must not be null"));
    }

    @Test
    void unknownStatusReturnsBadRequestWithErrorBody() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Call client\",\"status\":\"LATER\",\"due\":\"" + DUE + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request body"));
    }

    private static TaskEntity entity(Long id, String title, TaskEntity.Status status) {
        TaskEntity entity = new TaskEntity();
        ReflectionTestUtils.setField(entity, "id", id);
        entity.setTitle(title);
        entity.setStatus(status);
        return entity;
    }
}
