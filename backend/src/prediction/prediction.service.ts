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
  private readonly REQUEST_TIMEOUT = 5000;

  async getPrediction(data: PredictionRequest): Promise<PredictionResponse> {
    this.validatePredictionInput(data);

    try {
      const response = await axios.post(this.PYTHON_API_URL, data, {
        timeout: this.REQUEST_TIMEOUT,
      });
      return this.formatResponse(response.data, data);
    } catch (error) {
      return this.handlePredictionError(error);
    }
  }

  private validatePredictionInput(data: PredictionRequest): void {
    const errors: any[] = [];

    if (!data.distance || typeof data.distance !== 'number') {
      errors.push({
        field: 'distance',
        message: 'Distance is required and must be a number',
        received_value: data.distance,
      });
    } else if (data.distance <= 0 || data.distance > 2000) {
      errors.push({
        field: 'distance',
        message: 'Distance must be between 1 and 2000 km',
        received_value: data.distance,
      });
    }

    if (!data.num_stops || typeof data.num_stops !== 'number') {
      errors.push({
        field: 'num_stops',
        message: 'Number of stops is required and must be a number',
        received_value: data.num_stops,
      });
    } else if (data.num_stops < 1 || data.num_stops > 100) {
      errors.push({
        field: 'num_stops',
        message: 'Number of stops must be between 1 and 100',
        received_value: data.num_stops,
      });
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        error: 'Validation failed',
        details: errors,
        status: 400,
      });
    }
  }

  private formatResponse(modelData: any, input: PredictionRequest): PredictionResponse {
    if (typeof modelData.prediction !== 'number') {
      throw new InternalServerErrorException(
        'Invalid response from ML model'
      );
    }

    return {
      prediction: Math.round(modelData.prediction),
      duration_readable: modelData.duration_readable || 'N/A',
      breakdown: modelData.breakdown || {},
      note: modelData.note || '',
      factors: this.getDelayFactors(input),
      timestamp: new Date().toISOString(),
      input: {
        distance: input.distance,
        num_stops: input.num_stops,
      },
    };
  }

  private getDelayFactors(input: PredictionRequest): string[] {
    const factors: string[] = [];

    if (input.distance > 500) {
      factors.push('Long distance route');
    }

    if (input.num_stops > 15) {
      factors.push('Many stops - longer duration');
    } else if (input.num_stops < 5) {
      factors.push('Few stops - express train');
    }

    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 21)) {
      factors.push('Peak hours - potential delays');
    }

    return factors.length > 0 ? factors : ['Standard journey'];
  }

  private handlePredictionError(error: any): Promise<PredictionResponse> {
    console.error('Prediction error:', error.message);

    if (error instanceof AxiosError) {
      if (error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException({
          error: 'ML service unavailable',
          message: 'Python API not running',
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
          status: 504,
        });
      }
    }

    throw new InternalServerErrorException({
      error: 'Prediction failed',
      status: 500,
    });
  }
}
