package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.CreateClassRequest;
import com.reantask.api.dto.request.UpdateClassRequest;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.entity.ClassRoom;
import com.reantask.api.enums.ClassStatus;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.mapper.ClassMapper;
import com.reantask.api.repository.ClassRoomRepository;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.util.ClassCodeGenerator;

@ExtendWith(MockitoExtension.class)
class ClassServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    private static final LocalDate START = LocalDate.of(2026, 1, 5);
    private static final LocalDate END = LocalDate.of(2026, 6, 30);

    @Mock ClassRoomRepository classRepository;
    @Mock ClassCodeGenerator codeGenerator;
    @Mock CurrentUser currentUser;

    ClassServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ClassServiceImpl(classRepository, new ClassMapper(), codeGenerator, currentUser,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private static ClassRoom classRoom(Long id, ClassStatus status) {
        ClassRoom classRoom = ClassRoom.builder().name("Web 101").code("ABC123").description("Intro")
                .status(status).startAt(START).endDate(END).build();
        ReflectionTestUtils.setField(classRoom, "id", id);
        return classRoom;
    }

    private static void assertCode(Throwable e, ErrorCode expected) {
        assertThat(e).isInstanceOfSatisfying(AppException.class, ex -> assertThat(ex.getCode()).isEqualTo(expected));
    }

    // ---- create ----

    @Test
    void create_savesActiveClassWithGeneratedCode() {
        when(codeGenerator.generate()).thenReturn("ABC123");
        when(classRepository.codeExists("ABC123")).thenReturn(false);
        when(classRepository.save(any(ClassRoom.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassResponse response = service.create(new CreateClassRequest(" Web 101 ", " ", START, END));

        assertThat(response.code()).isEqualTo("ABC123");
        assertThat(response.name()).isEqualTo("Web 101");
        assertThat(response.description()).isNull();
        assertThat(response.status()).isEqualTo(ClassStatus.ACTIVE);
    }

    @Test
    void create_codeCollision_retriesWithNewCode() {
        when(codeGenerator.generate()).thenReturn("TAKEN1", "FREE22");
        when(classRepository.codeExists("TAKEN1")).thenReturn(true);
        when(classRepository.codeExists("FREE22")).thenReturn(false);
        when(classRepository.save(any(ClassRoom.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassResponse response = service.create(new CreateClassRequest("Web", null, START, END));

        assertThat(response.code()).isEqualTo("FREE22");
    }

    @Test
    void create_noFreeCode_throwsGenerationFailed() {
        when(codeGenerator.generate()).thenReturn("TAKEN1");
        when(classRepository.codeExists("TAKEN1")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new CreateClassRequest("Web", null, START, END)))
                .satisfies(e -> assertCode(e, ErrorCode.CLASS_CODE_GENERATION_FAILED));
        verify(codeGenerator, times(10)).generate();
        verify(classRepository, never()).save(any());
    }

    @Test
    void create_endBeforeStart_throwsInvalidDateRange() {
        assertThatThrownBy(() -> service.create(new CreateClassRequest("Web", null, END, START)))
                .satisfies(e -> assertCode(e, ErrorCode.INVALID_DATE_RANGE));
        verify(classRepository, never()).save(any());
    }

    @Test
    void create_endEqualsStart_isAllowed() {
        when(codeGenerator.generate()).thenReturn("ABC123");
        when(classRepository.save(any(ClassRoom.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassResponse response = service.create(new CreateClassRequest("Web", null, START, START));

        assertThat(response.endDate()).isEqualTo(START);
    }

    // ---- get ----

    @Test
    void get_found_returnsResponse() {
        when(classRepository.findById(1L)).thenReturn(Optional.of(classRoom(1L, ClassStatus.ACTIVE)));

        assertThat(service.get(1L).id()).isEqualTo(1L);
    }

    @Test
    void get_missing_throwsNotFound() {
        when(classRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L)).satisfies(e -> assertCode(e, ErrorCode.CLASS_NOT_FOUND));
    }

    // ---- update ----

    @Test
    void update_changesFieldsButKeepsCodeAndStatus() {
        ClassRoom existing = classRoom(1L, ClassStatus.INACTIVE);
        when(classRepository.findById(1L)).thenReturn(Optional.of(existing));

        ClassResponse response = service.update(1L,
                new UpdateClassRequest(" Web 102 ", "Next", START.plusDays(1), END.plusDays(1)));

        assertThat(response.name()).isEqualTo("Web 102");
        assertThat(response.startAt()).isEqualTo(START.plusDays(1));
        assertThat(response.code()).isEqualTo("ABC123");
        assertThat(response.status()).isEqualTo(ClassStatus.INACTIVE);
    }

    @Test
    void update_endBeforeStart_throwsInvalidDateRange() {
        when(classRepository.findById(1L)).thenReturn(Optional.of(classRoom(1L, ClassStatus.ACTIVE)));

        assertThatThrownBy(() -> service.update(1L, new UpdateClassRequest("Web", null, END, START)))
                .satisfies(e -> assertCode(e, ErrorCode.INVALID_DATE_RANGE));
    }

    @Test
    void update_missing_throwsNotFound() {
        when(classRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, new UpdateClassRequest("Web", null, START, END)))
                .satisfies(e -> assertCode(e, ErrorCode.CLASS_NOT_FOUND));
    }

    // ---- delete ----

    @Test
    void delete_found_setsDeletedAtAndActor() {
        ClassRoom existing = classRoom(1L, ClassStatus.ACTIVE);
        when(classRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(currentUser.id()).thenReturn(Optional.of(7L));

        service.delete(1L);

        assertThat(existing.getDeletedAt()).isEqualTo(NOW);
        assertThat(existing.getDeletedByUser()).isEqualTo(7L);
    }

    @Test
    void delete_missing_isNoOp() {
        when(classRepository.findById(99L)).thenReturn(Optional.empty());

        service.delete(99L);

        verify(classRepository).findById(99L);
    }

    // ---- list ----

    @Test
    @SuppressWarnings("unchecked")
    void list_defaultsToNewestFirstAndCapsPageSize() {
        when(classRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(classRoom(1L, ClassStatus.ACTIVE))));

        PageResponse<ClassResponse> response = service.list(null, null, PageRequest.of(0, 1000));

        assertThat(response.items()).hasSize(1);
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(classRepository).findAll(any(Specification.class), captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(100);
        assertThat(captor.getValue().getSort()).isEqualTo(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Test
    void list_unknownSortField_throwsInvalidSortField() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("code"));

        assertThatThrownBy(() -> service.list(null, null, pageable))
                .satisfies(e -> assertCode(e, ErrorCode.INVALID_SORT_FIELD));
    }
}
