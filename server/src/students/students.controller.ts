import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('students')
export class StudentsController {
  constructor(private service: StudentsService) {}

  @Get()
  findAll(
    @Query('grade') grade?: string,
    @Query('section') section?: string,
    @Query('classId') classId?: string,
  ) {
    return this.service.findAll(grade, section, classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'teacher')
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  update(@Param('id') id: string, @Body() dto: Partial<CreateStudentDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
