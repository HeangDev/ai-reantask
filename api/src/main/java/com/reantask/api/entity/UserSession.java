package com.reantask.api.entity;

import java.time.Instant;
import java.util.Objects;

import com.reantask.api.entity.base.TimestampedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSession extends TimestampedEntity {

    public static final int MAX_USER_AGENT_LENGTH = 500;
    public static final int MAX_IP_LENGTH = 45;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "jti", nullable = false, unique = true, length = 64)
    private String jti;

    @Column(name = "ip_address", length = MAX_IP_LENGTH)
    private String ipAddress;

    @Column(name = "user_agent", length = MAX_USER_AGENT_LENGTH)
    private String userAgent;

    @Column(name = "location")
    private String location;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public UserSession(Long userId, String jti, String ipAddress, String userAgent, String location,
            Instant expiresAt) {
        this.userId = userId;
        this.jti = jti;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.location = location;
        this.expiresAt = expiresAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserSession other)) {
            return false;
        }
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
