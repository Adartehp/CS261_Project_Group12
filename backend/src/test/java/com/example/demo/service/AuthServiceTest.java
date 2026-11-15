
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.entity.User.Role;
import com.example.demo.exception.AuthException;
import com.example.demo.repository.UserRepository;
import com.example.demo.tu.StudentInfo;
import com.example.demo.tu.TuApiClient;
import com.example.demo.tu.TuApiUnavailableException;

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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TuApiClient tuApiClient;

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

    private static final String ID = "6609999999";
    private static final String EMAIL = "somchai.jai@dome.tu.ac.th";

    // Test 4 (US1-B TC02): นักศึกษากรอก email + รหัสนักศึกษาที่หน้าเจ้าหน้าที่ -> 403
    @Test
    void loginStaff_shouldThrow403_whenStudentUsesTuCredentials() {

        when(userRepository.findByUsername(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase(EMAIL))
                .thenReturn(Optional.of(User.student(ID, EMAIL, "สมชาย ใจดี")));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginStaff(EMAIL, ID));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    // Test 5: ไม่พบผู้ใช้เลย -> 401
    @Test
    void loginStaff_shouldThrow401_whenUserNotFound() {

        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("nobody")).thenReturn(Optional.empty());

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginStaff("nobody", "x"));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    // Test 6 (US1-A TC01): email + รหัสนักศึกษาถูก -> login ได้ และบันทึกลง users
    @Test
    void loginStudent_shouldCreateUser_whenTuConfirmsEmail() {

        when(tuApiClient.getStudentInfo(ID))
                .thenReturn(Optional.of(new StudentInfo(ID, EMAIL, "สมชาย ใจดี")));
        when(userRepository.findByUsername(ID)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User user = authService.loginStudent("Somchai.Jai@dome.tu.ac.th", ID);

        assertEquals(ID, user.getUsername());
        assertEquals(EMAIL, user.getEmail());
        assertEquals("สมชาย ใจดี", user.getFullName());
        assertEquals(Role.STUDENT, user.getRole());
    }

    // Test 7: login ครั้งต่อไป อัปเดตชื่อจาก TU
    @Test
    void loginStudent_shouldUpdateProfile_whenUserExists() {

        when(tuApiClient.getStudentInfo(ID))
                .thenReturn(Optional.of(new StudentInfo(ID, EMAIL, "ชื่อใหม่")));
        when(userRepository.findByUsername(ID))
                .thenReturn(Optional.of(User.student(ID, EMAIL, "ชื่อเก่า")));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        assertEquals("ชื่อใหม่", authService.loginStudent(EMAIL, ID).getFullName());
    }

    // Test 8 (US1-A TC02): email ไม่ตรงกับรหัสนักศึกษา -> 401
    @Test
    void loginStudent_shouldThrow401_whenEmailDoesNotMatch() {

        when(tuApiClient.getStudentInfo(ID))
                .thenReturn(Optional.of(new StudentInfo(ID, EMAIL, "สมชาย ใจดี")));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginStudent("other@dome.tu.ac.th", ID));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    // Test 9: TU ไม่พบรหัสนี้ -> 401
    @Test
    void loginStudent_shouldThrow401_whenTuDoesNotKnowId() {

        when(tuApiClient.getStudentInfo(ID)).thenReturn(Optional.empty());

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginStudent(EMAIL, ID));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    // Test 10: รหัสนักศึกษาไม่ใช่ตัวเลข 10 หลัก -> 401 โดยไม่เรียก TU
    @Test
    void loginStudent_shouldThrow401_whenIdIsNotTenDigits() {

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginStudent(EMAIL, "abc"));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        verifyNoInteractions(tuApiClient);
    }

    // Test 11: TU API ล่ม -> 503
    @Test
    void loginStudent_shouldThrow503_whenTuIsDown() {

        when(tuApiClient.getStudentInfo(ID))
                .thenThrow(new TuApiUnavailableException("down", null));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginStudent(EMAIL, ID));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
    }
}
