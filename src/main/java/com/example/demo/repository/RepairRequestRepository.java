package com.example.demo.repository;

import com.example.demo.RepairRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}