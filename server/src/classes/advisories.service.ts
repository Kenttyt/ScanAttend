import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advisory } from './advisory.entity';
import { Student } from '../students/student.entity';

@Injectable()
export class AdvisoriesService {
  constructor(
    @InjectRepository(Advisory)
    private repo: Repository<Advisory>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  async create(data: any) {
    if (data.teacherId) {
      const existing = await this.repo.findOne({ where: { teacherId: data.teacherId } });
      if (existing) {
        throw new ConflictException(`Teacher already assigned to advisory "${existing.name}"`);
      }
    }
    const advisory = this.repo.create(data);
    return this.repo.save(advisory);
  }

  async update(id: string, data: any) {
    if (data.teacherId) {
      const existing = await this.repo.findOne({ where: { teacherId: data.teacherId } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Teacher already assigned to advisory "${existing.name}"`);
      }
    }
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  remove(id: string) {
    return this.repo.delete(id);
  }

  async assignStudent(advisoryId: string, studentId: string) {
    const advisory = await this.repo.findOneBy({ id: advisoryId });
    if (!advisory) throw new NotFoundException('Advisory not found');

    const student = await this.studentRepo.findOneBy({ id: studentId });
    if (!student) throw new NotFoundException('Student not found');

    if (student.classId === advisoryId) {
      throw new BadRequestException('Student is already assigned to this advisory');
    }

    student.classId = advisoryId;
    return this.studentRepo.save(student);
  }
}
