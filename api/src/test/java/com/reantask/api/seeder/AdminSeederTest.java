package com.reantask.api.seeder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.reantask.api.config.AdminSeedProperties;
import com.reantask.api.entity.Role;
import com.reantask.api.entity.User;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.repository.RoleRepository;
import com.reantask.api.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AdminSeederTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Mock RoleRepository roleRepository;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    AdminSeeder seeder;

    @BeforeEach
    void setUp() {
        AdminSeedProperties props = new AdminSeedProperties("Sim Kimheang", "SimKimheang4@gmail.com",
                "+85511263262", "password");
        seeder = new AdminSeeder(props, roleRepository, userRepository, passwordEncoder,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void run_noUserWithEmail_createsActiveAdminWithHashedPassword() {
        when(userRepository.emailTaken("simkimheang4@gmail.com", 0L)).thenReturn(false);
        when(roleRepository.findByName(RoleName.ADMIN)).thenReturn(Optional.of(new Role(RoleName.ADMIN)));
        when(userRepository.phoneTaken("+85511263262", 0L)).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("hashed");

        seeder.run(null);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        User user = saved.getValue();
        assertThat(user.getRole().getName()).isEqualTo(RoleName.ADMIN);
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.getEmail()).isEqualTo("simkimheang4@gmail.com");
        assertThat(user.getPhone()).isEqualTo("+85511263262");
        assertThat(user.getPassword()).isEqualTo("hashed");
        assertThat(user.getEmailVerifiedAt()).isEqualTo(NOW);
    }

    @Test
    void run_emailAlreadyExists_doesNothing() {
        when(userRepository.emailTaken("simkimheang4@gmail.com", 0L)).thenReturn(true);

        seeder.run(null);

        verify(userRepository, never()).save(any());
    }
}
