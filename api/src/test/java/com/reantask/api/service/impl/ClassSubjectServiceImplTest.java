package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

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
import org.springframework.test.util.ReflectionTestUtils;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.AssignClassSubjectRequest;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.dto.response.ClassSubjectResponse;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.entity.ClassRoom;
import com.reantask.api.entity.ClassSubject;
import com.reantask.api.entity.Subject;
import com.reantask.api.entity.User;
import com.reantask.api.enums.ClassStatus;
import com.reantask.api.enums.ClassSubjectStatus;
import com.reantask.api.enums.SubjectStatus;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.mapper.ClassMapper;
import com.reantask.api.mapper.ClassSubjectMapper;
import com.reantask.api.mapper.SubjectMapper;
import com.reantask.api.repository.ClassSubjectRepository;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.service.ClassService;
import com.reantask.api.service.SubjectService;
import com.reantask.api.service.UserService;

import jakarta.persistence.EntityManager;

@ExtendWith(MockitoExtension.class)
class ClassSubjectServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    private static final LocalDate START = LocalDate.of(2026, 1, 5);
    private static final LocalDate END = LocalDate.of(2026, 6, 30);
    private static final AssignClassSubjectRequest REQUEST = new AssignClassSubjectRequest(2L, 7L);

    @Mock ClassSubjectRepository classSubjectRepository;
    @Mock ClassService classService;
    @Mock SubjectService subjectService;
    @Mock UserService userService;
    @Mock CurrentUser currentUser;
    @Mock EntityManager entityManager;

    ClassSubjectServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ClassSubjectServiceImpl(classSubjectRepository, classService, subjectService, userService,
                new ClassSubjectMapper(new ClassMapper(), new SubjectMapper()), currentUser, entityManager);
    }

    private static ClassResponse classResponse(ClassStatus status) {
        return new ClassResponse(1L, "Web 101", "ABC123", null, status, START, END, NOW, NOW);
    }

    private static SubjectResponse subjectResponse(SubjectStatus status) {
        return new SubjectResponse(2L, "Java", null, status, NOW, NOW);
    }

    private static UserResponse user(String roleName, UserStatus status) {
        return new UserResponse(7L, 2L, roleName, "Sok", "sok@example.com", null, null, status, null, NOW, NOW);
    }

    private static <T> T withId(T entity, Long id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    private static ClassSubject classSubject(Long id) {
        ClassRoom classRoom = withId(ClassRoom.builder().name("Web 101").code("ABC123").status(ClassStatus.ACTIVE)
                .startAt(START).endDate(END).build(), 1L);
        Subject subject = withId(Subject.builder().name("Java").status(SubjectStatus.ACTIVE).build(), 2L);
        User teacher = withId(User.builder().build(), 7L);
        return withId(ClassSubject.builder().classRoom(classRoom).subject(subject).teacher(teacher)
                .status(ClassSubjectStatus.ACTIVE).build(), id);
    }

    private static void assertCode(Throwable e, ErrorCode expected) {
        assertThat(e).isInstanceOfSatisfying(AppException.class, ex -> assertThat(ex.getCode()).isEqualTo(expected));
    }

    private void stubValidAssign() {
        when(classService.get(1L)).thenReturn(classResponse(ClassStatus.ACTIVE));
        when(subjectService.get(2L)).thenReturn(subjectResponse(SubjectStatus.ACTIVE));
        when(userService.get(7L)).thenReturn(user("teacher", UserStatus.ACTIVE));
    }

    // ---- assign ----

    @Test
    void assign_valid_savesActiveRow() {
        stubValidAssign();
        when(classSubjectRepository.existsByClassRoom_IdAndSubject_Id(1L, 2L)).thenReturn(false);
        ClassSubject saved = classSubject(5L);
        when(entityManager.getReference(ClassRoom.class, 1L)).thenReturn(saved.getClassRoom());
        when(entityManager.getReference(Subject.class, 2L)).thenReturn(saved.getSubject());
        when(entityManager.getReference(User.class, 7L)).thenReturn(saved.getTeacher());
        when(classSubjectRepository.saveAndFlush(any(ClassSubject.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassSubjectResponse response = service.assign(1L, REQUEST);

        ArgumentCaptor<ClassSubject> captor = ArgumentCaptor.forClass(ClassSubject.class);
        verify(classSubjectRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ClassSubjectStatus.ACTIVE);
        assertThat(response.teacherId()).isEqualTo(7L);
        assertThat(response.classRoom().code()).isEqualTo("ABC123");
        assertThat(response.subject().name()).isEqualTo("Java");
    }

    @Test
    void assign_inactiveClass_throwsClassInactive() {
        when(classService.get(1L)).thenReturn(classResponse(ClassStatus.INACTIVE));

        assertThatThrownBy(() -> service.assign(1L, REQUEST)).satisfies(e -> assertCode(e, ErrorCode.CLASS_INACTIVE));
        verify(classSubjectRepository, never()).saveAndFlush(any());
    }

    @Test
    void assign_inactiveSubject_throwsSubjectInactive() {
        when(classService.get(1L)).thenReturn(classResponse(ClassStatus.ACTIVE));
        when(subjectService.get(2L)).thenReturn(subjectResponse(SubjectStatus.INACTIVE));

        assertThatThrownBy(() -> service.assign(1L, REQUEST))
                .satisfies(e -> assertCode(e, ErrorCode.SUBJECT_INACTIVE));
        verify(classSubjectRepository, never()).saveAndFlush(any());
    }

    @Test
    void assign_userIsNotTeacher_throwsTeacherInvalid() {
        when(classService.get(1L)).thenReturn(classResponse(ClassStatus.ACTIVE));
        when(subjectService.get(2L)).thenReturn(subjectResponse(SubjectStatus.ACTIVE));
        when(userService.get(7L)).thenReturn(user("student", UserStatus.ACTIVE));

        assertThatThrownBy(() -> service.assign(1L, REQUEST))
                .satisfies(e -> assertCode(e, ErrorCode.TEACHER_INVALID));
        verify(classSubjectRepository, never()).saveAndFlush(any());
    }

    @Test
    void assign_teacherNotActive_throwsTeacherInvalid() {
        when(classService.get(1L)).thenReturn(classResponse(ClassStatus.ACTIVE));
        when(subjectService.get(2L)).thenReturn(subjectResponse(SubjectStatus.ACTIVE));
        when(userService.get(7L)).thenReturn(user("teacher", UserStatus.SUSPENDED));

        assertThatThrownBy(() -> service.assign(1L, REQUEST))
                .satisfies(e -> assertCode(e, ErrorCode.TEACHER_INVALID));
    }

    @Test
    void assign_subjectAlreadyInClass_throwsConflict() {
        stubValidAssign();
        when(classSubjectRepository.existsByClassRoom_IdAndSubject_Id(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> service.assign(1L, REQUEST))
                .satisfies(e -> assertCode(e, ErrorCode.ALREADY_IN_CLASS));
        verify(classSubjectRepository, never()).saveAndFlush(any());
    }

    // ---- listMyTeaching ----

    @Test
    void listMyTeaching_usesSignedInTeacherAndDefaultSort() {
        when(currentUser.requireId()).thenReturn(7L);
        when(classSubjectRepository.findByTeacher(eq(7L), eq(ClassSubjectStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(classSubject(5L))));

        PageResponse<ClassSubjectResponse> page = service.listMyTeaching(ClassSubjectStatus.ACTIVE,
                PageRequest.of(0, 500));

        assertThat(page.items()).hasSize(1);
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(classSubjectRepository).findByTeacher(eq(7L), eq(ClassSubjectStatus.ACTIVE), captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(100);
        assertThat(captor.getValue().getSort()).isEqualTo(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Test
    void listMyTeaching_unknownSortField_throwsInvalidSortField() {
        when(currentUser.requireId()).thenReturn(7L);

        assertThatThrownBy(() -> service.listMyTeaching(null, PageRequest.of(0, 10, Sort.by("teacher"))))
                .satisfies(e -> assertCode(e, ErrorCode.INVALID_SORT_FIELD));
    }
}
