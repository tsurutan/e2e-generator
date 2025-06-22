import { Module } from '@nestjs/common';
import { EdgesService } from './edges.service';
import { EdgesRouter } from './edges.router';

@Module({
  providers: [EdgesService, EdgesRouter],
  exports: [EdgesService],
})
export class EdgesModule {}
