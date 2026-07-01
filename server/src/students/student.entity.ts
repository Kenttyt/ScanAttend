import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  grade: string;

  @Column()
  section: string;

  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @Column({ name: 'parent_phone', nullable: true })
  parentPhone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
