package com.reantask.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.reantask.api.entity.User;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.UserStatus;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    @EntityGraph(attributePaths = "role")
    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "role")
    Optional<User> findByGoogleId(String googleId);

    long countByRole_NameAndStatus(RoleName roleName, UserStatus status);

    // Native: emails and phones stay reserved after soft delete, so the @SQLRestriction must not apply.
    @Query(value = "SELECT COUNT(*) > 0 FROM users WHERE LOWER(email) = LOWER(:email) AND id <> :excludeId",
            nativeQuery = true)
    boolean emailTaken(@Param("email") String email, @Param("excludeId") Long excludeId);

    @Query(value = "SELECT COUNT(*) > 0 FROM users WHERE phone = :phone AND id <> :excludeId",
            nativeQuery = true)
    boolean phoneTaken(@Param("phone") String phone, @Param("excludeId") Long excludeId);
}
