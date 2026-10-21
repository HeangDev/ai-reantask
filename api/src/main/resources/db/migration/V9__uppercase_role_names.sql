-- RoleName is now stored by enum name (ADMIN, TEACHER, STUDENT) instead of lowercase.
UPDATE roles SET name = UPPER(name) WHERE name <> UPPER(name);
