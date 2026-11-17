package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(
            ResponseStatusException exception) {

        String message = exception.getReason();

        if (message == null) {
            message = "ดำเนินการไม่สำเร็จ";
        }

        return ResponseEntity
            .status(exception.getStatusCode())
            .body(Map.of("message", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> invalidJson() {

        return ResponseEntity
            .badRequest()
            .body(Map.of(
                "message",
                "รูปแบบข้อมูลไม่ถูกต้อง"
            ));
    }
}