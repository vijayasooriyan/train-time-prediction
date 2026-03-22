import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PredictionService {
  async getPrediction(data: any) {
    const response = await axios.post(
      'http://127.0.0.1:8000/predict',
      data,
    );
    return response.data;
  }
}
