package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/todos")
@CrossOrigin(origins = "*")
public class TodoController {
    private List<String> todosPOX = new ArrayList<>();
    
    // RMM: Level 0 - Swamp of Pox
    @RequestMapping("/gettodos")
    public String getAllTodosPOX() {
        return todosPOX.toString();
    }

    @RequestMapping("/getTodoById")
    public String getTodoById(int id) {
        return "Details of todo with ID: " + id;
    }

    public String createTodo(String todo) {
        return "Created todo: " + todo;
    }

    // RMM - Level 1 - Resources
    // RMM - Level 2 - HTTP Methods

    private final TodoService service;

    @Autowired
    public TodoController(TodoService service){
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TodoItem>> getAllTodos() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TodoItem> getTodo(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id).orElseThrow());
    }

    @PostMapping
    public ResponseEntity<TodoItem> createTodo(@RequestBody TodoItem newTodo) {
        service.save(newTodo);
        return ResponseEntity.status(HttpStatus.CREATED).body(newTodo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoItem> updateTodo(@PathVariable Long id,@RequestBody String title, @RequestBody String description, @RequestBody boolean isCompleted) {

        var existingTodo = service.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existingTodo.setTitle(title);
        existingTodo.setDescription(description);
        existingTodo.setCompleted(isCompleted);

        return ResponseEntity.ok(service.save(existingTodo));

   }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {   
        service.delete(id);
        return ResponseEntity.noContent().build();  
    }

}
