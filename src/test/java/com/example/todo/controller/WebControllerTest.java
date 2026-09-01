package com.example.todo.controller;

import com.example.todo.model.Todo;
import com.example.todo.service.TodoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import org.springframework.web.servlet.view.InternalResourceViewResolver;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class WebControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TodoService todoService;

    @InjectMocks
    private WebController webController;

    @BeforeEach
    void setUp() {
        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
        viewResolver.setPrefix("/templates/");
        viewResolver.setSuffix(".html");

        mockMvc = MockMvcBuilders.standaloneSetup(webController)
                .setViewResolvers(viewResolver)
                .build();
    }

    @Test
    void getIndexPage_shouldReturnIndexViewAndModel() throws Exception {
        Todo todo = new Todo(1L, "Sample Task", "Sample Desc", false, LocalDateTime.now(), LocalDateTime.now());
        when(todoService.getAllTodos(null, null)).thenReturn(List.of(todo));

        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(view().name("index"))
                .andExpect(model().attributeExists("todos"));
    }

    @Test
    void getAboutPage_shouldReturnAboutViewAndModel() throws Exception {
        Todo todo = new Todo(1L, "Sample Task", "Sample Desc", false, LocalDateTime.now(), LocalDateTime.now());
        when(todoService.getAllTodos(null, null)).thenReturn(List.of(todo));

        mockMvc.perform(get("/about"))
                .andExpect(status().isOk())
                .andExpect(view().name("about"))
                .andExpect(model().attributeExists("totalCount"));
    }
}
