package com.reantask.api.entity;

import java.time.LocalDate;
import java.util.Objects;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import com.reantask.api.entity.base.AuditableEntity;
import com.reantask.api.enums.ClassStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** Table {@code classes}; named ClassRoom to avoid clashing with {@link Class}. */
@Entity
@Table(name = "classes")
@SQLRestriction("deleted_at IS NULL")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class ClassRoom extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ToString.Include
    private Long id;

    @Setter
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "code", nullable = false, unique = true, updatable = false, length = 6)
    private String code;

    @Setter
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ClassStatus status;

    @Setter
    @Column(name = "start_at", nullable = false)
    private LocalDate startAt;

    @Setter
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Builder
    private ClassRoom(String name, String code, String description, ClassStatus status,
                      LocalDate startAt, LocalDate endDate) {
        this.name = name;
        this.code = code;
        this.description = description;
        this.status = status;
        this.startAt = startAt;
        this.endDate = endDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ClassRoom other)) {
            return false;
        }
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
