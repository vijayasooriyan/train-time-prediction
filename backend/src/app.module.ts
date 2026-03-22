import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PredictionService } from './prediction/prediction.service';
import { PredictionController } from './prediction/prediction.controller';

@Module({
  imports: [],
  controllers: [AppController, PredictionController],
  providers: [AppService, PredictionService],
})
export class AppModule {}
