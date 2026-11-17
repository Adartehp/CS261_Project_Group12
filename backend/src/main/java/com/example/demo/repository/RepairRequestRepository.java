package com.example.demo.repository;

import com.example.demo.RepairRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.time.LocalDateTime;

public interface RepairRequestRepository
        extends JpaRepository<RepairRequest, Long> {

    @Query("""
    SELECT r
    FROM RepairRequest r
    WHERE r.studentId = :studentId
      AND (:status IS NULL OR r.status = :status)
      AND (:fromDate IS NULL OR r.createdAt >= :fromDate)
      AND (:toDateExclusive IS NULL OR r.createdAt < :toDateExclusive)
    ORDER BY r.createdAt DESC, r.id DESC
    """)
    List<RepairRequest> findMine(
    @Param("studentId") String studentId,
    @Param("status") String status,
    @Param("fromDate") LocalDateTime fromDate,
    @Param("toDateExclusive") LocalDateTime toDateExclusive
    );
    @Modifying(
        clearAutomatically = true,
        flushAutomatically = true
    )
    @Query("""
        update RepairRequest r
        set r.status = 'IN_PROGRESS',
            r.acceptedAt = :now,
            r.updatedAt = :now
        where r.id = :id
          and r.status = 'PENDING'
        """)
    int acceptPending(
            @Param("id") Long id,
            @Param("now") LocalDateTime now
    );

    // US4: แก้ไขได้เฉพาะเจ้าของและยังเป็น PENDING ใน UPDATE เดียว
    // ไม่แตะ status / accepted_at จึงไม่เขียนทับการรับเรื่องของเจ้าหน้าที่
    @Modifying(
        clearAutomatically = true,
        flushAutomatically = true
    )
    @Query("""
        update RepairRequest r
        set r.roomNumber = :roomNumber,
            r.area = :area,
            r.repairItem = :repairItem,
            r.description = :description,
            r.updatedAt = :now
        where r.id = :id
          and r.studentId = :studentId
          and r.status = 'PENDING'
        """)
    int updatePendingDetails(
            @Param("id") Long id,
            @Param("studentId") String studentId,
            @Param("roomNumber") String roomNumber,
            @Param("area") String area,
            @Param("repairItem") String repairItem,
            @Param("description") String description,
            @Param("now") LocalDateTime now
    );
    // US7: เปลี่ยนสถานะใน UPDATE เดียวที่เช็คสถานะปัจจุบันไปพร้อมกัน
    // แตะเฉพาะคอลัมน์สถานะ จึงไม่เขียนทับรายละเอียดที่นักศึกษาเพิ่งแก้
    // และถ้าเจ้าหน้าที่อีกคนเปลี่ยนสถานะไปก่อน จะไม่มีแถวถูกแก้
    @Modifying(
        clearAutomatically = true,
        flushAutomatically = true
    )
    @Query("""
        update RepairRequest r
        set r.status = :newStatus,
            r.staffNote = :staffNote,
            r.completedAt = :completedAt,
            r.updatedAt = :now
        where r.id = :id
          and r.status in :allowedCurrent
        """)
    int changeStatus(
            @Param("id") Long id,
            @Param("allowedCurrent") java.util.Collection<String> allowedCurrent,
            @Param("newStatus") String newStatus,
            @Param("staffNote") String staffNote,
            @Param("completedAt") LocalDateTime completedAt,
            @Param("now") LocalDateTime now
    );

    @Query("""
        select r from RepairRequest r
        where (:status is null or r.status = :status)
          and (:area is null or r.area = :area)
          and (:room is null or r.roomNumber = :room)
          and (:studentId is null or r.studentId = :studentId)
          and (:fromDate is null or r.createdAt >= :fromDate)
          and (:toDate is null or r.createdAt < :toDate)
        """)
    java.util.List<RepairRequest> findFiltered(
            @Param("status") String status,
            @Param("area") String area,
            @Param("room") String room,
            @Param("studentId") String studentId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Sort sort
    );
}