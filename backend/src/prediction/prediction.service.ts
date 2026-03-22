import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { PredictionRequest, PredictionResponse } from './dto/prediction.dto';

@Injectable()
export class PredictionService {
  private readonly PYTHON_API_URL = 'http://127.0.0.1:8000/predict';
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds

  /**
   * IMPORTANT: Current implementation uses distance + speed
   * Real-world improvements needed:
   * 1. Accept train_number instead of speed
   * 2. Use station database to calculate actual distance
   * 3. Fetch timetable to get dwell times
   * 4. Factor in time-of-day (peak/off-peak)
   * 5. Track historical delays for accuracy
   */
  async getPrediction(data: PredictionRequest): Promise<PredictionResponse> {
    // 1. Validate input
    this.validatePredictionInput(data);

    try {
      // 2. Call Python ML API
      const response = await axios.post(this.PYTHON_API_URL, data, {
        timeout: this.REQUEST_TIMEOUT,
      });

      // 3. Validate and format response
      return this.formatResponse(response.data, data);
    } catch (error) {
      return this.handlePredictionError(error);
    }
  }

  /**
   * Validate prediction input parameters
   * Real-world constraints for train time prediction
   */
  private validatePredictionInput(data: PredictionRequest): void {
    const errors: any[] = [];

    // Distance validation
    if (!data.distance || typeof data.distance !== 'number') {
      errors.push({
        field: 'distance',
        message: 'Distance is required and must be a number (km)',
        received_value: data.distance,
      });
    } else if (data.distance <= 0 || data.distance > 2000) {
      errors.push({
        field: 'distance',
        message: 'Distance must be between 1 and 2000 km (realistic train routes)',
        received_value: data.distance,
      });
    }

    // Speed validation
    if (!data.speed || typeof data.speed !== 'number') {
      errors.push({
        field: 'speed',
        message: 'Speed is required and must be a number (km/h)',
        received_value: data.speed,
      });
    } else if (data.speed < 20 || data.speed > 200) {
      // 20 km/h = freight, 200 km/h = max high-speed trains
      errors.push({
        field: 'speed',
        message: 'Speed must be between 20 and 200 km/h (realistic train speeds)',
        received_value: data.speed,
      });
    }

    // Optional: Train number validation
    if (
      data.train_number &&
      (typeof data.train_number !== 'number' || data.train_number < 100 || data.train_number > 10000)
    ) {
      errors.push({
        field: 'train_number',
        message: 'Train number should be between 100 and 10000',
        received_value: data.train_number,
      });
    }

    // Optional: Time format validation
    if (data.departure_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.departure_time)) {
        errors.push({
          field: 'departure_time',
          message: 'Departure time must be in HH:MM format (24-hour)',
          received_value: data.departure_time,
        });
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        error: 'Validation failed',
        details: errors,
        status: 400,
      });
    }
  }

  /**
   * Format the response from Python ML model
   * Add metadata and units for clarity
   */
  private formatResponse(modelData: any, input: PredictionRequest): PredictionResponse {
    // Ensure prediction is a number
    if (typeof modelData.prediction !== 'number') {
      throw new InternalServerErrorException(
        'Invalid response from ML model: prediction must be numeric',
      );
    }

    return {
      prediction: Math.round(modelData.prediction), // Round to nearest minute
      confidence: 0.75, // Fixed for now, should improve with better model
      eta: this.calculateETA(modelData.prediction),
      factors: this.getDelayFactors(input),
      timestamp: new Date().toISOString(),
      input: {
        distance: input.distance,
        speed: input.speed,
      },
    };
  }

  /**
   * Calculate estimated arrival time
   * Currently simplified - should use actual timetables
   */
  private calculateETA(durationMinutes: number): string {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + durationMinutes * 60000);
    return arrivalTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24-hour format
    });
  }

  /**
   * Identify factors affecting journey time
   * From dataset analysis, these real-world factors matter:
   */
  private getDelayFactors(input: PredictionRequest): string[] {
    const factors: string[] = [];

    // Factor 1: Long distance trains have more stops
    if (input.distance > 500) {
      factors.push('Long distance route - multiple station stops');
    }

    // Factor 2: Low speed indicates passenger/local train
    if (input.speed < 60) {
      factors.push('Local/passenger train - more frequent stops');
    }

    // Factor 3: Peak hours (7-9 AM, 5-9 PM) - India standard
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 21)) {
      factors.push('Peak travel hours - potential delays');
    }

    // Factor 4: Higher speed trains usually express with fewer stops
    if (input.speed > 100) {
      factors.push('Express train - limited stops, faster travel');
    }

    return factors.length > 0 ? factors : ['No significant delays expected'];
  }

  /**
   * Handle errors from Python API or internal issues
   */
  private handlePredictionError(error: any): Promise<PredictionResponse> {
    console.error('Prediction error:', error.message);

    if (error instanceof AxiosError) {
      if (error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException({
          error: 'ML service unavailable',
          message: 'Python ML API is not running. Start it with: uvicorn app:app --reload',
          status: 503,
        });
      }

      if (error.response?.status === 422) {
        throw new BadRequestException({
          error: 'Invalid input for ML model',
          details: error.response.data,
          status: 400,
        });
      }

      if (error.code === 'ECONNABORTED') {
        throw new ServiceUnavailableException({
          error: 'ML service timeout',
          message: 'Prediction took too long. Try again with simpler inputs.',
          status: 504,
        });
      }
    }

    throw new InternalServerErrorException({
      error: 'Prediction failed',
      message: 'An unexpected error occurred while processing prediction',
      status: 500,
    });
  }
}
