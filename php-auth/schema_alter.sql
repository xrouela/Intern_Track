-- 1. Alter the users table to add the password column
ALTER TABLE users
ADD COLUMN password VARCHAR(255) NOT NULL AFTER email;

-- 2. Insert sample Admin and Intern users for testing
-- Admin Password: admin089
-- Intern Password: Intern123

INSERT INTO users (uid, name, email, password, role, department)
VALUES 
('001', 'Admin User', 'admin-internship@cp-360.com', '$2y$10$h0hKFwqOx1PJlQGMbeWfIeQDLZVIIH9Us7i4kNiFMYV8ZF/0ehTuq', 'admin', 'IT Management')
ON DUPLICATE KEY UPDATE 
email = 'admin-internship@cp-360.com',
password = '$2y$10$h0hKFwqOx1PJlQGMbeWfIeQDLZVIIH9Us7i4kNiFMYV8ZF/0ehTuq',
role = 'admin';

INSERT INTO users (uid, name, email, password, role, department)
VALUES 
('002', 'Intern User', 'intern@test.com', '$2y$10$S9LgLUI27I5V/rNUM.gh2ek9MOwdHMV0MAntAeyfMiymgsitV3Tb2', 'intern', 'IT Software Development')
ON DUPLICATE KEY UPDATE 
password = '$2y$10$S9LgLUI27I5V/rNUM.gh2ek9MOwdHMV0MAntAeyfMiymgsitV3Tb2',
role = 'intern';
