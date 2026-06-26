-- 1. Demote old accounts to standard admins
UPDATE users
SET role = 'admin'
WHERE email IN ('sestosorouela@gmail.com', 'catingub.jl@gmail.com');

-- 2. Promote cp-360.com account to superadmin
UPDATE users
SET role = 'superadmin'
WHERE email = 'admin-internship@cp-360.com';
