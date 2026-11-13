package com.example.demo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "repair_requests_demo1")
public class RepairRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, length = 20)
    private String studentId;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(nullable = false, length = 30)
    private String area;

    @Column(name = "repair_item", nullable = false, length = 200)
    private String repairItem;

    @Column(length = 150)
    private String description;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "staff_note", length = 500)
    private String staffNote;

    protected RepairRequest() {
    }

    public RepairRequest(
            String studentId,
            String roomNumber,
            String area,
            String repairItem,
            String description) {

        this.studentId = studentId;
        this.roomNumber = roomNumber;
        this.area = area;
        this.repairItem = repairItem;
        this.description = description;
        this.status = "PENDING";
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void updateStatus(String status, String staffNote) {
        this.status = status;
        this.staffNote = staffNote;

        if ("DONE".equals(status)) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public String getArea() {
        return area;
    }

    public String getRepairItem() {
        return repairItem;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public LocalDateTime getCompletedAt() {
    return completedAt;
    }

    public String getStaffNote() {
    return staffNote;
    }
}