import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAdvisoryDto {
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
  teacherId?: string;
}
