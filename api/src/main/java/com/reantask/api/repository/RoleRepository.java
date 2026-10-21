package com.reantask.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reantask.api.entity.Role;
import com.reantask.api.enums.RoleName;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);

    boolean existsByName(RoleName name);
}
