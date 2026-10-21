package com.reantask.api.repository;

import java.time.Instant;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.reantask.api.entity.UserSession;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    // Active = token not expired and not ended by logout (revoked_tokens). Newest login first.
    @Query(value = """
            SELECT s FROM UserSession s
            WHERE s.userId = :userId AND s.expiresAt > :now
              AND NOT EXISTS (SELECT 1 FROM RevokedToken r WHERE r.jti = s.jti)
            ORDER BY s.createdAt DESC, s.id DESC""",
            countQuery = """
            SELECT COUNT(s) FROM UserSession s
            WHERE s.userId = :userId AND s.expiresAt > :now
              AND NOT EXISTS (SELECT 1 FROM RevokedToken r WHERE r.jti = s.jti)""")
    Page<UserSession> findActive(@Param("userId") Long userId, @Param("now") Instant now, Pageable pageable);

    // Same filter as findActive, unpaged: used to end every login of one user at once.
    @Query("""
            SELECT s FROM UserSession s
            WHERE s.userId = :userId AND s.expiresAt > :now
              AND NOT EXISTS (SELECT 1 FROM RevokedToken r WHERE r.jti = s.jti)""")
    List<UserSession> findAllActive(@Param("userId") Long userId, @Param("now") Instant now);

    // Scoped to the owner, so another user's session id looks the same as one that does not exist.
    Optional<UserSession> findByIdAndUserId(Long id, Long userId);

    // Not a soft-delete table: expired sessions carry no history worth keeping.
    @Modifying
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
