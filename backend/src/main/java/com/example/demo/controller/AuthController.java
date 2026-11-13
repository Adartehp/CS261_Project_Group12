
package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.entity.User;
import com.example.demo.service.AuthService;
import com.example.demo.exception.AuthException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.context.SecurityContextRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    private final SecurityContextRepository securityContextRepository;

    public AuthController(
            AuthService authService,
            SecurityContextRepository securityContextRepository) {

        this.authService = authService;
        this.securityContextRepository = securityContextRepository;
    }

    /** US1-A: นักศึกษา login */
    @PostMapping("/student/login")
    public LoginResponse studentLogin(
            @Valid @RequestBody LoginRequest body,
            HttpServletRequest request,
            HttpServletResponse response) {

        throw new AuthException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "ระบบตรวจสอบนักศึกษายังไม่พร้อมใช้งาน"
        );
    }

    /** US1-B: เจ้าหน้าที่ login */
    @PostMapping("/staff/login")
    public LoginResponse staffLogin(
            @Valid @RequestBody LoginRequest body,
            HttpServletRequest request,
            HttpServletResponse response) {

        User user = authService.loginStaff(
                body.username(),
                body.password()
        );

        return createSession(user, request, response);
    }

    /** ตรวจสอบข้อมูลผู้ใช้ที่ login อยู่ */
    @GetMapping("/me")
    public LoginResponse me(Authentication authentication) {

        User user = authService.getUser(authentication.getName());

        return new LoginResponse(
                user.getUsername(),
                user.getFullName(),
                user.getRole()
        );
    }

    /** Logout */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();

        return ResponseEntity.noContent().build();
    }

    /** สร้าง Session หลังจาก Login สำเร็จ */
    private LoginResponse createSession(
            User user,
            HttpServletRequest request,
            HttpServletResponse response) {

        if (request.getSession(false) != null) {
            request.changeSessionId();
        }

        Authentication authentication =
                UsernamePasswordAuthenticationToken.authenticated(
                        user.getUsername(),
                        null,
                        List.of(new SimpleGrantedAuthority(
                                "ROLE_" + user.getRole().name()
                        ))
                );

        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(
                context, request, response
        );

        return new LoginResponse(
                user.getUsername(),
                user.getFullName(),
                user.getRole()
        );
    }
    
    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken csrfToken) {
        return csrfToken;
    }
}
