package com.example.demo.tu;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Duration;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * เรียก TU REST API: GET /api/v2/profile/std/info/?id={studentId}
 * Application-Key อ่านจาก env TU_API_KEY เท่านั้น ห้ามอยู่ในโค้ดหน้าเว็บ
 */
@Component
public class TuApiClient {

    private final RestClient restClient;
    private final String applicationKey;

    public TuApiClient(
            @Value("${tu.api.base-url}") String baseUrl,
            @Value("${tu.api.key:}") String applicationKey) {

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
        this.applicationKey = applicationKey;
    }

    /**
     * คืน StudentInfo ถ้า TU พบรหัสนี้ (status = true)
     * คืน Optional.empty() ถ้าไม่พบรหัสนักศึกษา
     * โยน TuApiUnavailableException ถ้า key ไม่ได้ตั้ง, timeout, 5xx หรือ 401/403
     */
    public Optional<StudentInfo> getStudentInfo(String studentId) {
        if (applicationKey == null || applicationKey.isBlank()) {
            throw new TuApiUnavailableException("ยังไม่ได้ตั้งค่า TU_API_KEY", null);
        }

        try {
            TuResponse body = restClient.get()
                    .uri(uri -> uri.path("/api/v2/profile/std/info/")
                            .queryParam("id", studentId)
                            .build())
                    .header("Application-Key", applicationKey)
                    .retrieve()
                    .body(TuResponse.class);

            if (body == null || !Boolean.TRUE.equals(body.status()) || body.data() == null) {
                return Optional.empty();
            }

            TuData d = body.data();
            return Optional.of(new StudentInfo(d.userName(), d.email(), d.displaynameTh()));

        } catch (HttpClientErrorException.NotFound | HttpClientErrorException.BadRequest e) {
            // TU ตอบว่าไม่พบ/รหัสไม่ถูกต้อง -> ถือว่า login ไม่ผ่าน
            return Optional.empty();
        } catch (RestClientException e) {
            // timeout, 5xx, 401/403 (key ผิด) -> ระบบ TU ใช้ไม่ได้
            throw new TuApiUnavailableException("เรียก TU API ไม่สำเร็จ", e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TuResponse(Boolean status, String message, TuData data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TuData(
            String userName,
            String email,
            @JsonProperty("displayname_th") String displaynameTh) {
    }
}
