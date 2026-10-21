package com.reantask.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.reantask.api.entity.ClassSubject;
import com.reantask.api.enums.ClassSubjectStatus;

public interface ClassSubjectRepository extends JpaRepository<ClassSubject, Long> {

    boolean existsByClassRoom_IdAndSubject_Id(Long classId, Long subjectId);

    // Rows whose class or subject was soft-deleted are hidden: the lazy ManyToOne would otherwise fail to load.
    @EntityGraph(attributePaths = {"classRoom", "subject"})
    @Query(value = """
            select cs from ClassSubject cs
            where cs.teacher.id = :teacherId
              and (:status is null or cs.status = :status)
              and cs.classRoom.deletedAt is null
              and cs.subject.deletedAt is null
            """,
            countQuery = """
            select count(cs) from ClassSubject cs
            where cs.teacher.id = :teacherId
              and (:status is null or cs.status = :status)
              and cs.classRoom.deletedAt is null
              and cs.subject.deletedAt is null
            """)
    Page<ClassSubject> findByTeacher(@Param("teacherId") Long teacherId,
                                     @Param("status") ClassSubjectStatus status, Pageable pageable);
}
