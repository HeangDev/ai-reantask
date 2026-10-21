package com.reantask.api.repository;

import org.springframework.data.jpa.domain.Specification;

import com.reantask.api.entity.Subject;
import com.reantask.api.enums.SubjectStatus;

public final class SubjectSpecifications {

    private SubjectSpecifications() {
    }

    public static Specification<Subject> hasStatus(SubjectStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<Subject> matches(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("name")), "%" + q.trim().toLowerCase() + "%");
        };
    }
}
