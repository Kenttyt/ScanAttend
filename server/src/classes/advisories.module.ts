import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisoriesService } from './advisories.service';
import { AdvisoriesController } from './advisories.controller';
import { Advisory } from './advisory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Advisory])],
  controllers: [AdvisoriesController],
  providers: [AdvisoriesService],
  exports: [AdvisoriesService],
})
export class AdvisoriesModule {}
