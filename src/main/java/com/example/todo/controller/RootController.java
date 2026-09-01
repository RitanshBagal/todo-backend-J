package com.example.todo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class RootController {

    @GetMapping({"/api", "/api/status"})
    public ResponseEntity<Map<String, Object>> getRootStatus() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "OK");
        response.put("service", "Todo Backend API");
        response.put("message", "Todo Backend API is running successfully");
        response.put("timestamp", LocalDateTime.now().toString());

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("GET /", "Web Application Dashboard");
        endpoints.put("GET /about", "About & Architecture Page");
        endpoints.put("GET /api", "Root API status and endpoints directory");
        endpoints.put("GET /api/todos", "Get all todos (supports ?completed=true|false and ?search=text)");
        endpoints.put("GET /api/todos/{id}", "Get todo by ID");
        endpoints.put("POST /api/todos", "Create a new todo");
        endpoints.put("PUT /api/todos/{id}", "Update a todo by ID");
        endpoints.put("PATCH /api/todos/{id}/toggle", "Toggle completion status of a todo");
        endpoints.put("DELETE /api/todos/{id}", "Delete a todo by ID");
        endpoints.put("DELETE /api/todos", "Delete all todos");

        response.put("endpoints", endpoints);
        return ResponseEntity.ok(response);
    }
}
