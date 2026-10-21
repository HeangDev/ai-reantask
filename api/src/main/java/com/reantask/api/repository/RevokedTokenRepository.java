package com.reantask.api.repository;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.reantask.api.entity.RevokedToken;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {

    boolean existsByJti(String jti);

    // Not a soft-delete table: expired rows are plain data and are purged for good.
    @Modifying
    @Query("DELETE FROM RevokedToken t WHERE t.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
