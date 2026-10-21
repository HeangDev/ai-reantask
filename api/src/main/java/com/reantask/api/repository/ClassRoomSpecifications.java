package com.reantask.api.repository;

import org.springframework.data.jpa.domain.Specification;

import com.reantask.api.entity.ClassRoom;
import com.reantask.api.enums.ClassStatus;

public final class ClassRoomSpecifications {

    private ClassRoomSpecifications() {
    }

    public static Specification<ClassRoom> hasStatus(ClassStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<ClassRoom> matches(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + q.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("code")), pattern));
        };
    }
}
