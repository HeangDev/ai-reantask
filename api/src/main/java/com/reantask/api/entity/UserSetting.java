package com.reantask.api.entity;

import java.util.Objects;

import com.reantask.api.entity.base.TimestampedEntity;
import com.reantask.api.enums.Language;
import com.reantask.api.enums.ThemeMode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSetting extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "theme_mode", nullable = false, length = 20)
    private ThemeMode themeMode = ThemeMode.SYSTEM;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "language", nullable = false, length = 10)
    private Language language = Language.EN;

    @Setter
    @Column(name = "email_notifications", nullable = false)
    private boolean emailNotifications = true;

    @Setter
    @Column(name = "push_notifications", nullable = false)
    private boolean pushNotifications = true;

    public UserSetting(Long userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserSetting other)) {
            return false;
        }
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
