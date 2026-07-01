import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  markedBy?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;
}
