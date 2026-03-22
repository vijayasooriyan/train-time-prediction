/**
 * DTO for Train Time Prediction
 * 
 * Uses Distance and Number of Stops to predict journey duration
 * Formula: duration = (distance/60 + num_stops*5) * 1.10 minutes
 */

export class PredictionRequest {
  /**
   * Distance in kilometers between stations
   * Must be between 1-2000 km
   */
  distance: number;

  /**
   * Total number of stops on the route
   * Includes both starting station and all intermediate stops
   * Typical: Local trains 10-30, Express 4-15, High-speed 2-8
   */
  num_stops: number;

  /**
   * Optional: Train number for reference
   * e.g., 107, 128 from Dataset
   */
  train_number?: number;

  /**
   * Optional: Source station code
   * e.g., "SWV", "MAO"
   */
  source_station?: string;

  /**
   * Optional: Destination station code
   * e.g., "PUNE", "MIRAJ"
   */
  dest_station?: string;

  /**
   * Optional: Departure time (HH:MM format)
   * For future: time-based delay analysis
   */
  departure_time?: string;
}

export class PredictionResponse {
  /**
   * Predicted journey duration in minutes
   */
  prediction: number;

  /**
   * Duration in human-readable format (e.g., "1h 18m")
   */
  duration_readable: string;

  /**
   * Breakdown of time calculation
   */
  breakdown: {
    base_travel_time_minutes: number;
    stops_dwell_time_minutes: number;
    subtotal_minutes: number;
    contingency_10_percent_minutes: number;
    total_predicted_minutes: number;
  };

  /**
   * Input echo for verification
   */
  input: {
    distance: number;
    num_stops: number;
  };

  /**
   * Estimated time factors
   */
  factors?: string[];

  /**
   * Timestamp of prediction
   */
  timestamp: string;

  /**
   * Formula used for calculation
   */
  note: string;
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
