import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', unique: true, nullable: true })
  email: string;

  @Column({ name: 'teacher_id', unique: true, nullable: true })
  teacherId: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  grade: string;

  @Column({ nullable: true })
  section: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
