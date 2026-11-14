package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.entity.User.Role;
import com.example.demo.exception.AuthException;
import com.example.demo.repository.UserRepository;
import com.example.demo.tu.StudentInfo;
import com.example.demo.tu.TuApiClient;
import com.example.demo.tu.TuApiUnavailableException;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    static final String BAD_CREDENTIALS =
            "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    static final String TU_UNAVAILABLE =
            "ระบบยืนยันตัวตนของมหาวิทยาลัยไม่พร้อมใช้งาน กรุณาลองใหม่";
    static final String STUDENT_ON_STAFF =
            "บัญชีนักศึกษาไม่สามารถเข้าสู่ระบบฝั่งเจ้าหน้าที่ได้";
    static final String STAFF_ON_STUDENT =
            "บัญชีเจ้าหน้าที่ไม่สามารถเข้าสู่ระบบฝั่งนักศึกษาได้";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TuApiClient tuApiClient;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TuApiClient tuApiClient) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tuApiClient = tuApiClient;
    }

    /**
     * US1-A: นักศึกษา login ผ่าน TU API
     * username = email, password = รหัสนักศึกษา 10 หลัก
     * - รหัสไม่ใช่ตัวเลข 10 หลัก / TU ไม่พบ / email ไม่ตรง -> 401
     * - TU API ใช้ไม่ได้ -> 503
     * - ผ่าน -> บันทึกหรืออัปเดตนักศึกษาในตาราง users
     */
    @Transactional
    public User loginStudent(String email, String studentId) {

        String cleanEmail = email.strip();
        String cleanId = studentId.strip();

        if (!cleanId.matches("\\d{10}")) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        StudentInfo info;
        try {
            info = tuApiClient.getStudentInfo(cleanId)
                    .orElseThrow(() -> new AuthException(
                            HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS));
        } catch (TuApiUnavailableException e) {
            throw new AuthException(HttpStatus.SERVICE_UNAVAILABLE, TU_UNAVAILABLE);
        }

        if (info.email() == null || !info.email().equalsIgnoreCase(cleanEmail)) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        String fullName = (info.displaynameTh() == null || info.displaynameTh().isBlank())
                ? cleanId
                : info.displaynameTh();

        Optional<User> existing = userRepository.findByUsername(cleanId);
        if (existing.isEmpty()) {
            return userRepository.save(User.student(cleanId, info.email(), fullName));
        }

        User user = existing.get();
        if (user.getRole() != Role.STUDENT) {
            throw new AuthException(HttpStatus.FORBIDDEN, STAFF_ON_STUDENT);
        }
        user.updateProfile(info.email(), fullName);
        return userRepository.save(user);
    }

    /**
     * US1-B: เจ้าหน้าที่ login ด้วยตาราง users + BCrypt
     * - ไม่พบผู้ใช้ / รหัสผ่านผิด -> 401
     * - กรอกข้อมูลบัญชีนักศึกษาถูกต้อง (US1-B TC02) -> 403
     */
    public User loginStaff(String username, String rawPassword) {

        String cleanUsername = username.strip();

        Optional<User> byUsername = userRepository.findByUsername(cleanUsername);
        if (byUsername.isEmpty()) {
            // นักศึกษากรอก email + รหัสนักศึกษา แบบเดียวกับหน้า login นักศึกษา
            rejectStudentCredentials(cleanUsername, rawPassword);
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        User user = byUsername.get();

        // ตรวจรหัสผ่านก่อน role เพื่อไม่บอกว่าบัญชีนี้เป็นนักศึกษาถ้ารหัสผิด
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        if (user.getRole() != Role.STAFF) {
            throw new AuthException(HttpStatus.FORBIDDEN, STUDENT_ON_STAFF);
        }

        return user;
    }

    /** ถ้า email + รหัสนักศึกษาตรงกับนักศึกษาที่เคย login แล้ว ให้ตอบ 403 */
    private void rejectStudentCredentials(String email, String rawPassword) {
        userRepository.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == Role.STUDENT)
                .filter(u -> u.getUsername().equals(rawPassword.strip()))
                .ifPresent(u -> {
                    throw new AuthException(HttpStatus.FORBIDDEN, STUDENT_ON_STAFF);
                });
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
