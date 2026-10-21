package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.ChangeSubjectStatusRequest;
import com.reantask.api.dto.request.CreateSubjectRequest;
import com.reantask.api.dto.request.UpdateSubjectRequest;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.entity.Subject;
import com.reantask.api.enums.SubjectStatus;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.mapper.SubjectMapper;
import com.reantask.api.repository.SubjectRepository;
import com.reantask.api.security.CurrentUser;

@ExtendWith(MockitoExtension.class)
class SubjectServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Mock SubjectRepository subjectRepository;
    @Mock CurrentUser currentUser;

    SubjectServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SubjectServiceImpl(subjectRepository, new SubjectMapper(), currentUser,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private static Subject subject(Long id, SubjectStatus status) {
        Subject subject = Subject.builder().name("Java").description("Intro").status(status).build();
        ReflectionTestUtils.setField(subject, "id", id);
        return subject;
    }

    // ---- create ----

    @Test
    void create_savesActiveSubjectWithTrimmedName() {
        when(subjectRepository.save(any(Subject.class))).thenAnswer(inv -> inv.getArgument(0));

        SubjectResponse response = service.create(new CreateSubjectRequest("  Java  ", "  "));

        assertThat(response.name()).isEqualTo("Java");
        assertThat(response.description()).isNull();
        assertThat(response.status()).isEqualTo(SubjectStatus.ACTIVE);
    }

    // ---- get ----

    @Test
    void get_found_returnsResponse() {
        when(subjectRepository.findById(1L)).thenReturn(Optional.of(subject(1L, SubjectStatus.ACTIVE)));

        assertThat(service.get(1L).id()).isEqualTo(1L);
    }

    @Test
    void get_missing_throwsNotFound() {
        when(subjectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.SUBJECT_NOT_FOUND));
    }

    // ---- update ----

    @Test
    void update_changesNameAndDescriptionButNotStatus() {
        Subject existing = subject(1L, SubjectStatus.INACTIVE);
        when(subjectRepository.findById(1L)).thenReturn(Optional.of(existing));

        SubjectResponse response = service.update(1L, new UpdateSubjectRequest(" Spring ", "Boot"));

        assertThat(response.name()).isEqualTo("Spring");
        assertThat(response.description()).isEqualTo("Boot");
        assertThat(response.status()).isEqualTo(SubjectStatus.INACTIVE);
    }

    @Test
    void update_missing_throwsNotFound() {
        when(subjectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, new UpdateSubjectRequest("Spring", null)))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.SUBJECT_NOT_FOUND));
    }

    // ---- status ----

    @Test
    void changeStatus_toInactive_updatesStatus() {
        Subject existing = subject(1L, SubjectStatus.ACTIVE);
        when(subjectRepository.findById(1L)).thenReturn(Optional.of(existing));

        SubjectResponse response = service.changeStatus(1L, new ChangeSubjectStatusRequest(SubjectStatus.INACTIVE));

        assertThat(response.status()).isEqualTo(SubjectStatus.INACTIVE);
    }

    @Test
    void changeStatus_sameStatus_isIdempotent() {
        Subject existing = subject(1L, SubjectStatus.ACTIVE);
        when(subjectRepository.findById(1L)).thenReturn(Optional.of(existing));

        SubjectResponse response = service.changeStatus(1L, new ChangeSubjectStatusRequest(SubjectStatus.ACTIVE));

        assertThat(response.status()).isEqualTo(SubjectStatus.ACTIVE);
    }

    @Test
    void changeStatus_missing_throwsNotFound() {
        when(subjectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeStatus(99L, new ChangeSubjectStatusRequest(SubjectStatus.INACTIVE)))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.SUBJECT_NOT_FOUND));
    }

    // ---- delete ----

    @Test
    void delete_found_setsDeletedAtAndActor() {
        Subject existing = subject(1L, SubjectStatus.ACTIVE);
        when(subjectRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(currentUser.id()).thenReturn(Optional.of(7L));

        service.delete(1L);

        assertThat(existing.getDeletedAt()).isEqualTo(NOW);
        assertThat(existing.getDeletedByUser()).isEqualTo(7L);
    }

    @Test
    void delete_missing_isNoOp() {
        when(subjectRepository.findById(99L)).thenReturn(Optional.empty());

        service.delete(99L);

        verify(subjectRepository).findById(99L);
    }

    // ---- list ----

    @Test
    @SuppressWarnings("unchecked")
    void list_defaultsToNewestFirstAndCapsPageSize() {
        Page<Subject> page = new PageImpl<>(List.of(subject(1L, SubjectStatus.ACTIVE)));
        when(subjectRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResponse<SubjectResponse> response = service.list(null, null, PageRequest.of(0, 1000));

        assertThat(response.items()).hasSize(1);
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(subjectRepository).findAll(any(Specification.class), captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(100);
        assertThat(captor.getValue().getSort()).isEqualTo(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Test
    void list_unknownSortField_throwsInvalidSortField() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("description"));

        assertThatThrownBy(() -> service.list(null, null, pageable))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_SORT_FIELD));
    }
}
