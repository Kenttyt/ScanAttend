import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsString()
  @IsNotEmpty()
  section: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsString()
  @IsNotEmpty()
  parentPhone: string;
}
