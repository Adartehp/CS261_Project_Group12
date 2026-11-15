package com.example.demo.repository;

import com.example.demo.RepairRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}