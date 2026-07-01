import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advisory } from './advisory.entity';

@Injectable()
export class AdvisoriesService {
  constructor(
    @InjectRepository(Advisory)
    private repo: Repository<Advisory>,
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
}
