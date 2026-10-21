package com.reantask.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.reantask.api.entity.ClassRoom;

public interface ClassRoomRepository extends JpaRepository<ClassRoom, Long>, JpaSpecificationExecutor<ClassRoom> {

    // Native: the unique key includes soft-deleted rows, so the @SQLRestriction must not apply.
    @Query(value = "SELECT COUNT(*) > 0 FROM classes WHERE code = :code", nativeQuery = true)
    boolean codeExists(@Param("code") String code);
}
