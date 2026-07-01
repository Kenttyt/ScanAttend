import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/user.entity';
import { Student } from './students/student.entity';
import { Advisory } from './classes/advisory.entity';
import { Attendance } from './attendance/attendance.entity';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, Student, Advisory, Attendance],
    synchronize: true,
    ssl: { rejectUnauthorized: false },
  });

  await ds.initialize();
  console.log('Connected to database');

  const userRepo = ds.getRepository(User);
  const studentRepo = ds.getRepository(Student);
  const advisoryRepo = ds.getRepository(Advisory);
  const attendanceRepo = ds.getRepository(Attendance);

  // Seed users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const passHash = await bcrypt.hash('pass123', 10);

  const users = [
    { email: 'admin@school.com', name: 'Dr. Sarah Chen', role: 'admin', passwordHash },
    { teacherId: 'T001', name: 'Mr. James Wilson', role: 'teacher', grade: '10', section: 'A', passwordHash: teacherHash },
    { teacherId: 'T002', name: 'Ms. Lisa Park', role: 'teacher', grade: '10', section: 'B', passwordHash: passHash },
  ];

  for (const u of users) {
    const existing = u.teacherId
      ? await userRepo.findOne({ where: { teacherId: u.teacherId } })
      : await userRepo.findOne({ where: { email: u.email } });
    if (!existing) {
      await userRepo.save(userRepo.create(u));
      console.log(`Created user: ${u.name}`);
    }
  }

  // Seed advisories
  const advisories = [
    { name: '10-A', grade: '10', section: 'A', teacherId: 'T001', schedule: 'Mon-Fri 08:00-09:30' },
    { name: '10-B', grade: '10', section: 'B', teacherId: 'T002', schedule: 'Mon-Fri 09:45-11:15' },
  ];

  const savedAdvisories: any[] = [];
  for (const a of advisories) {
    let existing = await advisoryRepo.findOne({ where: { name: a.name } });
    if (!existing) {
      existing = await advisoryRepo.save(advisoryRepo.create(a));
      console.log(`Created advisory: ${a.name}`);
    }
    savedAdvisories.push(existing);
  }

  // Seed students
  const students = [
    { id: '001', name: 'Emma Thompson', grade: '10', section: 'A', classId: savedAdvisories[0]?.id, parentPhone: '555-0101' },
    { id: '002', name: 'Liam Garcia', grade: '10', section: 'A', classId: savedAdvisories[0]?.id, parentPhone: '555-0102' },
    { id: '003', name: 'Olivia Kim', grade: '10', section: 'A', classId: savedAdvisories[0]?.id, parentPhone: '555-0103' },
    { id: '004', name: 'Noah Patel', grade: '10', section: 'B', classId: savedAdvisories[1]?.id, parentPhone: '555-0104' },
    { id: '005', name: 'Ava Rodriguez', grade: '10', section: 'B', classId: savedAdvisories[1]?.id, parentPhone: '555-0105' },
  ];

  for (const s of students) {
    const existing = await studentRepo.findOne({ where: { id: s.id } });
    if (!existing) {
      await studentRepo.save(studentRepo.create(s));
      console.log(`Created student: ${s.name}`);
    }
  }

  console.log('Seed complete!');
  await ds.destroy();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
