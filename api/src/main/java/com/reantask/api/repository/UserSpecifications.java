package com.reantask.api.repository;

import org.springframework.data.jpa.domain.Specification;

import com.reantask.api.entity.User;
import com.reantask.api.enums.UserStatus;

import jakarta.persistence.criteria.JoinType;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    /** Fetches the role in the same query for list screens (no N+1); skipped for count queries. */
    public static Specification<User> fetchRole() {
        return (root, query, cb) -> {
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("role", JoinType.INNER);
            }
            return cb.conjunction();
        };
    }

    public static Specification<User> hasStatus(UserStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<User> hasRoleId(Long roleId) {
        return (root, query, cb) -> roleId == null ? cb.conjunction() : cb.equal(root.get("role").get("id"), roleId);
    }

    public static Specification<User> matches(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + q.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("fullname")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern));
        };
    }
}
