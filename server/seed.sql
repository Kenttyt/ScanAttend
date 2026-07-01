-- ScanAttend - Supabase Seed Data
-- Run this after creating your Supabase project and updating schema

-- Users (passwords are bcrypt hashes)
-- admin123 = $2b$10$rQZ8K9v1Jx5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e
-- teacher123 = $2b$10$rQZ8K9v1Jx5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e
-- pass123 = $2b$10$rQZ8K9v1Jx5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e

-- Note: Generate proper bcrypt hashes with the seed script instead:
-- cd server && npm run seed

-- Or manually insert with proper hashes:

INSERT INTO users (id, email, teacher_id, password_hash, name, role, subject, grade, section)
VALUES
  (gen_random_uuid(), 'admin@school.com', NULL, '$2b$10$YourHashHere', 'Dr. Sarah Chen', 'admin', NULL, NULL, NULL),
  (gen_random_uuid(), NULL, 'T001', '$2b$10$YourHashHere', 'Mr. James Wilson', 'teacher', 'Mathematics', '10', 'A'),
  (gen_random_uuid(), NULL, 'T002', '$2b$10$YourHashHere', 'Ms. Lisa Park', 'teacher', 'Science', '10', 'B')
ON CONFLICT DO NOTHING;

-- Advisories
INSERT INTO advisories (id, name, grade, section, teacher_id, schedule)
SELECT gen_random_uuid(), '10-A', '10', 'A', 'T001', 'Mon-Fri 08:00-09:30'
WHERE NOT EXISTS (SELECT 1 FROM advisories WHERE name = '10-A');

INSERT INTO advisories (id, name, grade, section, teacher_id, schedule)
SELECT gen_random_uuid(), '10-B', '10', 'B', 'T002', 'Mon-Fri 09:45-11:15'
WHERE NOT EXISTS (SELECT 1 FROM advisories WHERE name = '10-B');

-- Students (using advisory IDs from above)
INSERT INTO students (id, name, grade, section, class_id, parent_phone)
SELECT 'S001', 'Emma Thompson', '10', 'A', a.id, '555-0101'
FROM advisories a WHERE a.name = '10-A'
AND NOT EXISTS (SELECT 1 FROM students WHERE id = 'S001');

INSERT INTO students (id, name, grade, section, class_id, parent_phone)
SELECT 'S002', 'Liam Garcia', '10', 'A', a.id, '555-0102'
FROM advisories a WHERE a.name = '10-A'
AND NOT EXISTS (SELECT 1 FROM students WHERE id = 'S002');

INSERT INTO students (id, name, grade, section, class_id, parent_phone)
SELECT 'S003', 'Olivia Kim', '10', 'A', a.id, '555-0103'
FROM advisories a WHERE a.name = '10-A'
AND NOT EXISTS (SELECT 1 FROM students WHERE id = 'S003');

INSERT INTO students (id, name, grade, section, class_id, parent_phone)
SELECT 'S004', 'Noah Patel', '10', 'B', a.id, '555-0104'
FROM advisories a WHERE a.name = '10-B'
AND NOT EXISTS (SELECT 1 FROM students WHERE id = 'S004');

INSERT INTO students (id, name, grade, section, class_id, parent_phone)
SELECT 'S005', 'Ava Rodriguez', '10', 'B', a.id, '555-0105'
FROM advisories a WHERE a.name = '10-B'
AND NOT EXISTS (SELECT 1 FROM students WHERE id = 'S005');
