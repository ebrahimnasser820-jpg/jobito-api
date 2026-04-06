import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'ptj', name: 'about_stats' })
export class AboutStat {
  @PrimaryGeneratedColumn({ name: 'stat_id' })
  statId: number;

  @Column({ nullable: true })
  label: string;

  @Column({ name: 'label_en', nullable: true })
  labelEn: string;

  @Column({ nullable: true })
  value: string;

  @Column({ nullable: true })
  icon: string;
}
