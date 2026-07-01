import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({ ...dto, passwordHash });
    try {
      return await this.repo.save(user);
    } catch (e) {
      if (e.code === '23505') throw new ConflictException('User already exists');
      throw e;
    }
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    const update: any = { ...dto };
    if (dto.password) {
      update.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    delete update.password;
    await this.repo.update(id, update);
    return this.repo.findOneBy({ id });
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
