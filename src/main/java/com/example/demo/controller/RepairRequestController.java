package com.example.demo.controller;

import com.example.demo.RepairRequest;
import com.example.demo.repository.RepairRequestRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair-requests")
public class RepairRequestController {

    private final RepairRequestRepository repository;

    public RepairRequestController(
            RepairRequestRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<RepairRequest> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public RepairRequest create(
            @RequestBody RepairRequest request) {
        return repository.save(request);
    }
}