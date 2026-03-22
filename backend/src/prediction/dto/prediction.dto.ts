/**
 * DTO for Train Time Prediction
 * 
 * Real-world train prediction requires actual identifiers, not synthetic speed values
 * Current implementation uses distance and speed for simplicity, but should evolve to:
 * - train_number: Which train (e.g., 107, 128)
 * - source_station: Departure station code (e.g., "SWV", "MAO")
 * - dest_station: Destination station code (e.g., "PUNE")
 * - departure_time: Departure time (HH:MM format)
 */

export class PredictionRequest {
  /**
   * Distance in kilometers (derived from actual train route)
   * Should be > 0 and < 2000 km
   */
  distance: number;

  /**
   * Average speed in km/h (derived from train type)
   * Typical values:
   * - Passenger trains: 40-60 km/h
   * - Express trains: 80-100 km/h
   * - Freight: 30-50 km/h
   * 
   * TODO: Replace with train_number for real-world use
   */
  speed: number;

  /**
   * Optional: Train number for better predictions
   */
  train_number?: number;

  /**
   * Optional: Source station code
   */
  source_station?: string;

  /**
   * Optional: Destination station code
   */
  dest_station?: string;

  /**
   * Optional: Departure time (HH:MM format)
   */
  departure_time?: string;
}

export class PredictionResponse {
  /**
   * Predicted journey time in minutes
   */
  prediction: number;

  /**
   * For future enhancement: Confidence level (0-1)
   */
  confidence?: number;

  /**
   * For future enhancement: Estimated arrival time
   */
  eta?: string;

  /**
   * For future enhancement: List of delay factors
   */
  factors?: string[];

  /**
   * Timestamp of prediction
   */
  timestamp: string;

  /**
   * Input parameters echo for verification
   */
  input: {
    distance: number;
    speed: number;
  };
}

export class PredictionValidationError {
  error: string;
  details: {
    field: string;
    message: string;
    received_value: any;
  }[];
  status: number;
}
