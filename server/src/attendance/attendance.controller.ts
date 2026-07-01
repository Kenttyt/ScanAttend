import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('date') date?: string,
    @Query('grade') grade?: string,
    @Query('section') section?: string,
  ) {
    return this.service.findAll(classId, date, grade, section);
  }

  @Post()
  @Roles('teacher')
  mark(@Body() dto: CreateAttendanceDto) {
    return this.service.mark(dto.classId, dto.studentId, dto.status, dto.markedBy);
  }
}
