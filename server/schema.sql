-- ScanAttend - Database Schema
-- Run this in Supabase SQL Editor if you want to create tables manually

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  teacher_id TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  subject TEXT,
  grade TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  teacher_id TEXT,
  schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  class_id UUID REFERENCES advisories(id),
  parent_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  class_id UUID REFERENCES advisories(id),
  student_id TEXT REFERENCES students(id),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, class_id, student_id)
);
