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
   * Input: Distance (km) + Number of stops
   * Output: Predicted journey duration with breakdown
   * 
   * Formula: (distance/60 + num_stops*5) * 1.10
   * - avg_speed: 60 km/h
   * - dwell_time_per_stop: 5 minutes
   * - contingency: 10% buffer
   * 
   * Request body example:
   * {
   *   "distance": 78,          // km (required)
   *   "num_stops": 3,          // number (required)
   *   "train_number": 107,     // optional
   *   "source_station": "SWV", // optional
   *   "dest_station": "MAO",   // optional
   *   "departure_time": "10:25"// optional (HH:MM format)
   * }
   * 
   * Response example:
   * {
   *   "prediction": 105,
   *   "duration_readable": "1h 45m",
   *   "breakdown": {...},
   *   "factors": [...],
   *   "timestamp": "2024-03-22T10:25:00Z",
   *   "input": {"distance": 78, "num_stops": 3},
   *   "note": "Calculation formula..."
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
