package com.reantask.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reantask.api.entity.UserSetting;

public interface UserSettingRepository extends JpaRepository<UserSetting, Long> {

    Optional<UserSetting> findByUserId(Long userId);
}
