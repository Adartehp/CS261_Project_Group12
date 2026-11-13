
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.entity.User.Role;
import com.example.demo.exception.AuthException;
import com.example.demo.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    static final String BAD_CREDENTIALS =
            "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Staff Login
    public User loginStaff(String username, String password) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED,
                        BAD_CREDENTIALS
                ));

        // ตรวจสอบ Role ก่อน
        if (user.getRole() != Role.STAFF) {
            throw new AuthException(
                    HttpStatus.FORBIDDEN,
                    "บัญชีนักศึกษาไม่สามารถเข้าสู่ระบบฝั่งเจ้าหน้าที่ได้"
            );
        }

        // ตรวจสอบ Password ด้วย BCrypt
        if (user.getPasswordHash() == null ||
                !passwordEncoder.matches(
                        password, user.getPasswordHash())) {

            throw new AuthException(
                    HttpStatus.UNAUTHORIZED,
                    BAD_CREDENTIALS
            );
        }

        return user;
    }

    // ตรวจสอบผู้ใช้งานจาก Session
    public User getUser(String username) {

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED,
                        BAD_CREDENTIALS
                ));
    }
}
