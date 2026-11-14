
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.entity.User.Role;
import com.example.demo.exception.AuthException;
import com.example.demo.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User staffUser;

    @BeforeEach
    void setUp() {
        staffUser = new User(
                "staff01",
                "hashed-password",
                "Staff Test",
                "staff@test.com",
                Role.STAFF
        );
    }

    // Test 1: Login สำเร็จเมื่อ Password และ Role ถูกต้อง
    @Test
    void loginStaff_shouldReturnUser_whenCredentialsAreCorrect() {

        when(userRepository.findByUsername("staff01"))
                .thenReturn(Optional.of(staffUser));

        when(passwordEncoder.matches(
                "staff1234",
                "hashed-password"
        )).thenReturn(true);

        User result = authService.loginStaff(
                "staff01",
                "staff1234"
        );

        assertNotNull(result);
        assertEquals("staff01", result.getUsername());
        assertEquals(Role.STAFF, result.getRole());

        verify(passwordEncoder).matches(
                "staff1234",
                "hashed-password"
        );
    }

    // Test 2: Login ไม่สำเร็จเมื่อ Password ผิด
    @Test
    void loginStaff_shouldThrow401_whenPasswordIsWrong() {

        when(userRepository.findByUsername("staff01"))
                .thenReturn(Optional.of(staffUser));

        when(passwordEncoder.matches(
                "wrong-password",
                "hashed-password"
        )).thenReturn(false);

        AuthException exception = assertThrows(
                AuthException.class,
                () -> authService.loginStaff(
                        "staff01",
                        "wrong-password"
                )
        );

        assertEquals(
                HttpStatus.UNAUTHORIZED,
                exception.getStatus()
        );
    }

    // Test 3: Login ไม่สำเร็จเมื่อ Role ไม่ตรงกัน
    @Test
    void loginStaff_shouldThrow403_whenUserIsStudent() {

        User studentUser = new User(
                "student01",
                "hashed-password",
                "Student Test",
                "student@test.com",
                Role.STUDENT
        );

        when(userRepository.findByUsername("student01"))
                .thenReturn(Optional.of(studentUser));

        when(passwordEncoder.matches(
                "student1234",
                "hashed-password"
        )).thenReturn(true);

        AuthException exception = assertThrows(
                AuthException.class,
                () -> authService.loginStaff(
                        "student01",
                        "student1234"
                )
        );

        assertEquals(
                HttpStatus.FORBIDDEN,
                exception.getStatus()
        );
    }
}
