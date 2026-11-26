package com.example.taskmanager;

import com.example.taskmanager.generated.model.ErrorResponse;
import com.example.taskmanager.task.TaskNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(TaskNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse notFound(TaskNotFoundException ex) {
        return new ErrorResponse().message(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse invalid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + " " + describe(error))
                .sorted()
                .collect(Collectors.joining("; "));
        return new ErrorResponse().message(message);
    }

    // The spec only uses `pattern` to reject whitespace-only text; the default message would expose the regex
    private static String describe(FieldError error) {
        return "Pattern".equals(error.getCode()) ? "must not be blank" : error.getDefaultMessage();
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse unreadable() {
        return new ErrorResponse().message("Malformed request body");
    }
}
