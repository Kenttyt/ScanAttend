import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Advisory } from '../classes/advisory.entity';

@Entity('students')
export class Student {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @ManyToOne(() => Advisory, { nullable: true, eager: true })
  @JoinColumn({ name: 'class_id' })
  advisory: Advisory;

  @Column({ name: 'parent_phone', nullable: true })
  parentPhone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
