
package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // ใช้ Session เก็บข้อมูลการ Login
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    // ตั้งค่าระบบ Security
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SecurityContextRepository securityContextRepository) throws Exception {

        http
            // ป้องกัน CSRF โดยเก็บ Token ใน Cookie
            .csrf(csrf -> csrf
                .csrfTokenRepository(
                    CookieCsrfTokenRepository.withHttpOnlyFalse()
                )
            )

            // ใช้ Session สำหรับเก็บ SecurityContext
            .securityContext(context -> context
                .securityContextRepository(securityContextRepository)
            )

            // สร้าง Session เมื่อจำเป็น
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )

            // กำหนดสิทธิ์การเข้าถึง API
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/student/login",
                    "/api/auth/staff/login",
                    "/api/auth/csrf"
                ).permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    // ใช้ BCrypt สำหรับเข้ารหัสและตรวจสอบรหัสผ่าน
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
