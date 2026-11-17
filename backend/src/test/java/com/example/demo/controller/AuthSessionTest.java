package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.entity.User.Role;
import com.example.demo.repository.RepairRequestRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.tu.StudentInfo;
import com.example.demo.tu.TuApiClient;
import com.example.demo.tu.TuApiUnavailableException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US1-A, US1-B: login ผ่าน API จริง (controller + Spring Security + session)
 * โดย mock เฉพาะ TU API
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthSessionTest {

    private static final String STAFF = "staff01";
    private static final String STAFF_PASSWORD = "staff1234";
    private static final String STUDENT_ID = "6609611111";
    private static final String STUDENT_EMAIL = "somchai.jai@dome.tu.ac.th";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RepairRequestRepository repairRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private TuApiClient tuApiClient;

    @BeforeEach
    void setUp() {
        repairRequestRepository.deleteAll();
        userRepository.deleteAll();

        userRepository.save(new User(
            STAFF,
            passwordEncoder.encode(STAFF_PASSWORD),
            "เจ้าหน้าที่ทดสอบ",
            null,
            Role.STAFF
        ));

        when(tuApiClient.getStudentInfo(STUDENT_ID))
            .thenReturn(Optional.of(new StudentInfo(STUDENT_ID, STUDENT_EMAIL, "สมชาย ใจดี")));
    }

    // ---------- US1-A นักศึกษา ----------

    @Test
    void studentLoginCreatesSessionWithStudentRole() throws Exception {
        MockHttpSession session = login("student", STUDENT_EMAIL, STUDENT_ID);

        mockMvc.perform(get("/api/auth/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value(STUDENT_ID))
            .andExpect(jsonPath("$.role").value("STUDENT"));

        mockMvc.perform(get("/api/repair-requests/mine").session(session))
            .andExpect(status().isOk());
    }

    @Test
    void studentWithWrongEmailGets401AndNoSession() throws Exception {
        MvcResult result = mockMvc.perform(loginRequest("student", "other@dome.tu.ac.th", STUDENT_ID))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"))
            .andReturn();

        assertNotLoggedIn(result);
    }

    @Test
    void unknownStudentIdGets401WithNotFoundMessage() throws Exception {
        when(tuApiClient.getStudentInfo("6609699999")).thenReturn(Optional.empty());

        mockMvc.perform(loginRequest("student", STUDENT_EMAIL, "6609699999"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("ไม่พบรหัสประจำตัวนี้ในระบบ"));
    }

    @Test
    void tuApiDownGets503() throws Exception {
        when(tuApiClient.getStudentInfo(STUDENT_ID))
            .thenThrow(new TuApiUnavailableException("down", null));

        mockMvc.perform(loginRequest("student", STUDENT_EMAIL, STUDENT_ID))
            .andExpect(status().isServiceUnavailable());
    }

    @Test
    void studentCannotCallStaffApis() throws Exception {
        MockHttpSession session = login("student", STUDENT_EMAIL, STUDENT_ID);

        mockMvc.perform(get("/api/repair-requests").session(session))
            .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/repair-requests/1/accept").session(session))
            .andExpect(status().isForbidden());
    }

    // ---------- US1-B เจ้าหน้าที่ ----------

    @Test
    void staffLoginCreatesSessionWithStaffRole() throws Exception {
        MockHttpSession session = login("staff", STAFF, STAFF_PASSWORD);

        mockMvc.perform(get("/api/auth/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value(STAFF))
            .andExpect(jsonPath("$.role").value("STAFF"));

        mockMvc.perform(get("/api/repair-requests").session(session))
            .andExpect(status().isOk());
    }

    @Test
    void staffWithWrongPasswordGets401AndNoSession() throws Exception {
        MvcResult result = mockMvc.perform(loginRequest("staff", STAFF, "wrong-password"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"))
            .andReturn();

        assertNotLoggedIn(result);
    }

    @Test
    void studentCredentialsOnStaffLoginGet403() throws Exception {
        // นักศึกษาต้องเคย login มาก่อนจึงมีบัญชีในตาราง users
        login("student", STUDENT_EMAIL, STUDENT_ID);

        MvcResult result = mockMvc.perform(loginRequest("staff", STUDENT_EMAIL, STUDENT_ID))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("บัญชีนักศึกษาไม่สามารถเข้าสู่ระบบฝั่งเจ้าหน้าที่ได้"))
            .andReturn();

        assertNotLoggedIn(result);
    }

    @Test
    void staffCannotCallStudentOnlyApis() throws Exception {
        MockHttpSession session = login("staff", STAFF, STAFF_PASSWORD);

        mockMvc.perform(get("/api/repair-requests/mine").session(session))
            .andExpect(status().isForbidden());
    }

    // ---------- session ----------

    @Test
    void blankCredentialsGet400() throws Exception {
        mockMvc.perform(loginRequest("staff", " ", ""))
            .andExpect(status().isBadRequest());
    }

    @Test
    void anonymousRequestsGet401() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/repair-requests")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/repair-requests/mine")).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutEndsTheSession() throws Exception {
        MockHttpSession session = login("staff", STAFF, STAFF_PASSWORD);

        mockMvc.perform(post("/api/auth/logout").session(session))
            .andExpect(status().isNoContent());

        assertTrue(session.isInvalid());

        mockMvc.perform(get("/api/auth/me").session(new MockHttpSession()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void loginChangesTheSessionIdToPreventFixation() throws Exception {
        MockHttpSession before = new MockHttpSession();
        String oldId = before.getId();

        MvcResult result = mockMvc.perform(loginRequest("staff", STAFF, STAFF_PASSWORD).session(before))
            .andExpect(status().isOk())
            .andReturn();

        assertNotEquals(oldId, result.getRequest().getSession().getId());
    }

    // ---------- helpers ----------

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder loginRequest(
            String who, String username, String password) {

        return post("/api/auth/" + who + "/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username": "%s", "password": "%s"}
                """.formatted(username, password));
    }

    private MockHttpSession login(String who, String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(loginRequest(who, username, password))
            .andExpect(status().isOk())
            .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session, "login must create a session");
        return session;
    }

    private void assertNotLoggedIn(MvcResult result) throws Exception {
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        if (session == null) {
            return;
        }
        mockMvc.perform(get("/api/auth/me").session(session))
            .andExpect(status().isUnauthorized());
    }
}
