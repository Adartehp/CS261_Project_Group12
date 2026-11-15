package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.entity.User.Role;
import com.example.demo.exception.AuthException;
import com.example.demo.repository.UserRepository;
import com.example.demo.tu.StudentInfo;
import com.example.demo.tu.TuApiClient;

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
     * US1-A (โหมดทดสอบปิด TU API): ตรวจสอบรูปแบบ email @dome.tu.ac.th และรหัส 10 หลัก
     * แล้วบันทึก/อัปเดตนักศึกษาลงตาราง users ใน MySQL ทันที
     */
    @Transactional
    public User loginStudent(String email, String studentId) {

        String cleanEmail = email.strip();
        String cleanId = studentId.strip();

        if (!cleanId.matches("\\d{10}")) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        if (!cleanEmail.toLowerCase().endsWith("@dome.tu.ac.th")) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        // สร้างข้อมูลนักศึกษาจำลองแทนการเรียก TU API
        String displayName = cleanEmail.split("@")[0];
        StudentInfo info = new StudentInfo(cleanId, cleanEmail, displayName);

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
     */
    public User loginStaff(String username, String rawPassword) {

        String cleanUsername = username.strip();

        Optional<User> byUsername = userRepository.findByUsername(cleanUsername);
        if (byUsername.isEmpty()) {
            rejectStudentCredentials(cleanUsername, rawPassword);
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        User user = byUsername.get();

        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        if (user.getRole() != Role.STAFF) {
            throw new AuthException(HttpStatus.FORBIDDEN, STUDENT_ON_STAFF);
        }

        return user;
    }

    private void rejectStudentCredentials(String email, String rawPassword) {
        userRepository.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == Role.STUDENT)
                .filter(u -> u.getUsername().equals(rawPassword.strip()))
                .ifPresent(u -> {
                    throw new AuthException(HttpStatus.FORBIDDEN, STUDENT_ON_STAFF);
                });
    }

    public User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED,
                        BAD_CREDENTIALS
                ));
    }
}