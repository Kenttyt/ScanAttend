import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('attendance')
@Unique(['date', 'classId', 'studentId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column()
  status: string;

  @Column({ name: 'marked_by', type: 'varchar', nullable: true })
  markedBy: string | null;

  @Column({ type: 'varchar', nullable: true })
  timestamp: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
