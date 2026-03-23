export class PredictionRequest {
  distance: number;
  num_stops: number;
  train_number?: number;
}

export class PredictionResponse {
  prediction: number;
  duration_readable: string;
  breakdown: Record<string, any>;
  input: {
    distance: number;
    num_stops: number;
  };
  factors?: string[];
  timestamp: string;
  note: string;
}
