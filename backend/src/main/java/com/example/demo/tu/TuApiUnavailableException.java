package com.example.demo.tu;

/** เรียก TU API ไม่สำเร็จ (timeout, 5xx, key ผิด) */
public class TuApiUnavailableException extends RuntimeException {

    public TuApiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
