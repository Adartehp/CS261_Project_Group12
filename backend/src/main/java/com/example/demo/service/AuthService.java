
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

    // ตรวจสอบ Login ทั้ง Student และ Staff
    public User login(
            String username,
            String rawPassword,
            Role expectedRole) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED,
                        BAD_CREDENTIALS
                ));

        // ตรวจสอบ Password ก่อน Role
        if (user.getPasswordHash() == null ||
                !passwordEncoder.matches(
                        rawPassword,
                        user.getPasswordHash())) {

            throw new AuthException(
                    HttpStatus.UNAUTHORIZED,
                    BAD_CREDENTIALS
            );
        }

        // ตรวจสอบ Role หลัง Password ถูกต้อง
        if (user.getRole() != expectedRole) {

            String message = (user.getRole() == Role.STUDENT)
                    ? "บัญชีนักศึกษาไม่สามารถเข้าสู่ระบบฝั่งเจ้าหน้าที่ได้"
                    : "บัญชีเจ้าหน้าที่ไม่สามารถเข้าสู่ระบบฝั่งนักศึกษาได้";

            throw new AuthException(
                    HttpStatus.FORBIDDEN,
                    message
            );
        }

        return user;
    }

    // Staff Login
    public User loginStaff(String username, String password) {
        return login(username, password, Role.STAFF);
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
