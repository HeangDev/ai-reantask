-- City / country of the login, shown on the sessions screen. NULL until a GeoIP lookup fills it.
ALTER TABLE user_sessions ADD COLUMN location VARCHAR(255);
