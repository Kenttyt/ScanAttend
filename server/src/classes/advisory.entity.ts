import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('advisories')
export class Advisory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  grade: string;

  @Column()
  section: string;

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
