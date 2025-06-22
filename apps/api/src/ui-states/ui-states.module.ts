import { Module } from '@nestjs/common';
import { UiStatesService } from './ui-states.service';
import { UiStatesRouter } from './ui-states.router';

@Module({
  providers: [UiStatesService, UiStatesRouter],
  exports: [UiStatesService],
})
export class UiStatesModule {}
