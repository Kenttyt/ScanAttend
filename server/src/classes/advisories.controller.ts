import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { AdvisoriesService } from './advisories.service';
import { CreateAdvisoryDto } from './dto/create-advisory.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('advisories')
export class AdvisoriesController {
  constructor(private service: AdvisoriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateAdvisoryDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAdvisoryDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/students')
  @Roles('admin')
  assignStudent(@Param('id') id: string, @Body('studentId') studentId: string) {
    return this.service.assignStudent(id, studentId);
  }

  @Get(':id/students')
  findStudents(@Param('id') id: string) {
    return this.service.findStudents(id);
  }

  @Delete(':id/students/:studentId')
  @Roles('admin')
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.service.removeStudent(id, studentId);
  }
}
