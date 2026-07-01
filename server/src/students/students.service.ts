import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private repo: Repository<Student>,
  ) {}

  findAll(grade?: string, section?: string, classId?: string) {
    const where: any = {};
    if (grade) where.grade = grade;
    if (section) where.section = section;
    if (classId) where.classId = classId;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  create(dto: CreateStudentDto) {
    const student = this.repo.create(dto);
    return this.repo.save(student);
  }

  async update(id: string, dto: Partial<CreateStudentDto>) {
    await this.repo.update(id, dto);
    return this.repo.findOneBy({ id });
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
