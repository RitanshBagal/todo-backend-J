package com.example.todo.controller;

import com.example.todo.service.TodoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    private final TodoService todoService;

    public WebController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("todos", todoService.getAllTodos(null, null));
        return "index";
    }

    @GetMapping("/about")
    public String about(Model model) {
        model.addAttribute("totalCount", todoService.getAllTodos(null, null).size());
        return "about";
    }
}
