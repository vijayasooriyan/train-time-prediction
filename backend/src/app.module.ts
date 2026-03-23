import { Module } from '@nestjs/common';
import { RootController } from './root.controller';
import { PredictionService } from './prediction/prediction.service';
import { PredictionController } from './prediction/prediction.controller';

@Module({
  imports: [],
  controllers: [RootController, PredictionController],
  providers: [PredictionService],
})
export class AppModule {}
