package com.reantask.api.entity;

import java.time.Instant;
import java.util.Objects;

import org.hibernate.annotations.SQLRestriction;

import com.reantask.api.entity.base.AuditableEntity;
import com.reantask.api.enums.UserStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "users")
@SQLRestriction("deleted_at IS NULL")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class User extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ToString.Include
    private Long id;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Setter
    @Column(name = "fullname", nullable = false, length = 255)
    private String fullname;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Setter
    @Column(name = "phone", unique = true, length = 20)
    private String phone;

    @Setter
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Setter
    @Column(name = "avatar", length = 255)
    private String avatar;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserStatus status;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Builder
    private User(Role role, String fullname, String email, String phone, String password,
                 String avatar, UserStatus status, String googleId, Instant emailVerifiedAt) {
        this.role = role;
        this.fullname = fullname;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.avatar = avatar;
        this.status = status;
        this.googleId = googleId;
        this.emailVerifiedAt = emailVerifiedAt;
    }

    /** Google has verified this email, so the account is linked to the Google id and the email counts as verified. */
    public void linkGoogleAccount(String googleId, Instant verifiedAt) {
        this.googleId = googleId;
        if (this.emailVerifiedAt == null) {
            this.emailVerifiedAt = verifiedAt;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof User other)) {
            return false;
        }
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
