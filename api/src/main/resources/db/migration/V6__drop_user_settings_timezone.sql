-- The per-user timezone setting is no longer used. All timestamps stay in UTC.

ALTER TABLE user_settings DROP COLUMN timezone;
