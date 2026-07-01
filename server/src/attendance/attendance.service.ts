import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private repo: Repository<Attendance>,
  ) {}

  private getPHDate() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' });
  }

  private getPHTimestamp() {
    const now = new Date();
    const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const hours = phTime.getHours();
    const minutes = String(phTime.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes}${period}`;
  }

  async mark(classId: string, studentId: string, status: string, markedBy?: string) {
    const date = this.getPHDate();
    const timestamp = status !== 'absent' ? this.getPHTimestamp() : null;

    const existing = await this.repo.findOne({ where: { date, classId, studentId } });

    if (existing) {
      existing.status = status;
      existing.timestamp = timestamp;
      existing.markedBy = markedBy ?? null;
      return this.repo.save(existing);
    }

    const record = this.repo.create({ date, classId, studentId, status, markedBy: markedBy ?? null, timestamp });
    return this.repo.save(record);
  }

  async findAll(classId?: string, date?: string, grade?: string, section?: string) {
    const qb = this.repo.createQueryBuilder('a');

    if (classId) qb.andWhere('a.class_id = :classId', { classId });
    if (date) qb.andWhere('a.date = :date', { date });

    if (grade || section) {
      qb.innerJoin('students', 's', 's.id = a.student_id');
      if (grade) qb.andWhere('s.grade = :grade', { grade });
      if (section) qb.andWhere('s.section = :section', { section });
    }

    qb.orderBy('a.created_at', 'DESC');
    return qb.getMany();
  }
}
