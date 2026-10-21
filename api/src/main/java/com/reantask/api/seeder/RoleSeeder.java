package com.reantask.api.seeder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.entity.Role;
import com.reantask.api.enums.RoleName;
import com.reantask.api.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

/** Idempotent: inserts only the roles that are missing. */
@Component
@Order(RoleSeeder.ORDER)
@RequiredArgsConstructor
public class RoleSeeder implements ApplicationRunner {

    /** Seeders that need roles run after this one. */
    public static final int ORDER = 0;

    private static final Logger log = LoggerFactory.getLogger(RoleSeeder.class);

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (RoleName name : RoleName.values()) {
            if (!roleRepository.existsByName(name)) {
                roleRepository.save(new Role(name));
                log.info("Seeded role {}", name);
            }
        }
    }
}
