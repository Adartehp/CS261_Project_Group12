package com.example.demo.repository;

import com.example.demo.RepairRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;

public interface RepairRequestRepository
        extends JpaRepository<RepairRequest, Long> {

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