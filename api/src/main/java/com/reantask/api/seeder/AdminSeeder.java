package com.reantask.api.seeder;

import java.time.Clock;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.config.AdminSeedProperties;
import com.reantask.api.entity.Role;
import com.reantask.api.entity.User;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.repository.RoleRepository;
import com.reantask.api.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/** Idempotent: creates the first admin only when no user has that email yet (deleted users keep their email). */
@Component
@Order(RoleSeeder.ORDER + 1)
@EnableConfigurationProperties(AdminSeedProperties.class)
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);
    private static final long NO_USER_ID = 0L;

    private final AdminSeedProperties props;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = props.email().trim().toLowerCase();
        if (userRepository.emailTaken(email, NO_USER_ID)) {
            return;
        }
        Role admin = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException("Role admin must be seeded before the admin user"));
        String phone = props.phone() == null || props.phone().isBlank() ? null : props.phone().trim();
        if (phone != null && userRepository.phoneTaken(phone, NO_USER_ID)) {
            log.warn("Admin seed skipped: phone is already used by another user");
            return;
        }
        userRepository.save(User.builder()
                .role(admin)
                .fullname(props.fullname().trim())
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(props.password()))
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(Instant.now(clock))
                .build());
        log.info("Seeded admin user {}", email);
    }
}
