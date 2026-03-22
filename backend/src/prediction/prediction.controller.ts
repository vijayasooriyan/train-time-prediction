import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictionRequest, PredictionResponse } from './dto/prediction.dto';

/**
 * Prediction Controller
 * 
 * Endpoint: POST /prediction
 * 
 * Real-world improvements needed:
 * - Add GET /trains endpoint to list available trains
 * - Add GET /stations endpoint to list available stations
 * - Add GET /routes endpoint to show routes and distances
 * - Add caching for train timetables
 * - Add rate limiting
 */
@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  /**
   * Get train travel time prediction
   * 
   * Current: Uses distance and speed (synthetic)
   * Real-world: Should use train_number and stations
   * 
   * Request body example:
   * {
   *   "distance": 78,          // km (required)
   *   "speed": 60,             // km/h (required)
   *   "train_number": 107,     // optional
   *   "source_station": "SWV", // optional
   *   "dest_station": "MAO",   // optional
   *   "departure_time": "10:25"// optional (HH:MM format)
   * }
   * 
   * Response example:
   * {
   *   "prediction": 78,                    // expected duration in minutes
   *   "confidence": 0.75,                  // accuracy confidence (0-1)
   *   "eta": "11:45",                      // estimated arrival time
   *   "factors": ["..."],                  // factors affecting journey
   *   "timestamp": "2024-01-15T10:25:00Z", // when prediction was made
   *   "input": {...}                       // echo of input for verification
   * }
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async predict(@Body() predictionRequest: PredictionRequest): Promise<PredictionResponse> {
    return this.predictionService.getPrediction(predictionRequest);
  }

  /**
   * FUTURE: Health check for prediction service status
   * GET /prediction/health
   */

  /**
   * FUTURE: Get available trains
   * GET /prediction/trains
   */

  /**
   * FUTURE: Get station list
   * GET /prediction/stations
   */

  /**
   * FUTURE: Get route details
   * GET /prediction/routes/:routeId
   */
}
