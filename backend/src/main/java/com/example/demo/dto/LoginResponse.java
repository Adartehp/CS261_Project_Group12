package com.example.demo.dto;

import com.example.demo.entity.User.Role;

public record LoginResponse(String username, String fullName, Role role) {
}
