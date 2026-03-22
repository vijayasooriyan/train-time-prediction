import { Controller, Post, Body } from '@nestjs/common';
import { PredictionService } from './prediction.service';

@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  async predict(@Body() body: any) {
    return this.predictionService.getPrediction(body);
  }
}
