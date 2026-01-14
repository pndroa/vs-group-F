package com.example.demo;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class TodoService {
    private final TodoRepository repo;

    public TodoService(TodoRepository repo){
        this.repo = repo;
    }

    public List<TodoItem> findAll() {
        return repo.findAll();
    }


    public Optional<TodoItem> findById(Long id){
        return repo.findById(id);
    }

    @Transactional
    public TodoItem save(TodoItem todo){
        return repo.save(todo);
    }

    @Transactional
    public void delete(Long id){
        repo.deleteById(id);
    }

}
