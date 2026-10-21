package com.reantask.api.entity.base;

import java.time.Instant;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

/** Audit + soft-delete columns shared by most tables. */
@MappedSuperclass
@Getter
public abstract class AuditableEntity extends TimestampedEntity {

    @CreatedBy
    @Column(name = "created_by_user", updatable = false)
    private Long createdByUser;

    @LastModifiedBy
    @Column(name = "updated_by_user")
    private Long updatedByUser;

    @Setter
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Setter
    @Column(name = "deleted_by_user")
    private Long deletedByUser;
}
