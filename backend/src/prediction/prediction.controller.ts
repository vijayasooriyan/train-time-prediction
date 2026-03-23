import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictionRequest, PredictionResponse } from './dto/prediction.dto';


@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  
  @Post()
  @HttpCode(HttpStatus.OK)
  async predict(@Body() predictionRequest: PredictionRequest): Promise<PredictionResponse> {
    return this.predictionService.getPrediction(predictionRequest);
  }

  
}
