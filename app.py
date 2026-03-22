from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, validator
import joblib
import numpy as np
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Train Time Prediction API",
    description="ML model for predicting train journey times",
    version="1.0.0"
)

# Load model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    try:
        model = joblib.load('train_model.pkl')
        logger.info("✓ ML model loaded successfully")
    except Exception as e:
        logger.error(f"✗ Error loading model: {e}")
        model = None

# =============================================================================
# IMPORTANT NOTES ON PROJECT LOGIC
# =============================================================================
# Current implementation: Predicts time = distance / speed
# 
# Real-world improvements needed:
# 1. Use actual train timetables instead of synthetic speed
# 2. Factor in stop durations between stations
# 3. Consider time-of-day variations (peak/off-peak)
# 4. Add delay patterns from historical data
# 5. Implement confidence intervals
# 
# Current output: Journey duration in MINUTES
# =============================================================================

class PredictionRequest(BaseModel):
    """
    Train journey time prediction request.
    
    Uses real-world parameters:
    - distance: Km between start and end stations
    - num_stops: Number of stops (stations) on the route
    
    Formula: journey_time = (distance / avg_speed) + (num_stops * dwell_time_per_stop)
    """
    
    distance: float = Field(..., gt=0, le=2000, description="Distance in km (1-2000)")
    num_stops: int = Field(..., ge=1, le=100, description="Number of stops (1-100)")
    train_number: Optional[int] = Field(None, description="Optional: Train number (e.g., 107, 128)")
    source_station: Optional[str] = Field(None, description="Optional: Source station code")
    dest_station: Optional[str] = Field(None, description="Optional: Destination station code")
    departure_time: Optional[str] = Field(None, description="Optional: Departure time (HH:MM format)")

    @validator('distance')
    def validate_distance(cls, v):
        if v <= 0:
            raise ValueError('Distance must be positive')
        if v > 2000:
            raise ValueError('Distance cannot exceed 2000 km')
        return v

    @validator('num_stops')
    def validate_stops(cls, v):
        if v < 1:
            raise ValueError('Number of stops must be at least 1')
        if v > 100:
            raise ValueError('Number of stops cannot exceed 100')
        return v

class PredictionResponse(BaseModel):
    """
    Response from prediction model.
    
    Prediction includes:
    - prediction: Journey time in MINUTES
    - duration_readable: Human-readable format (e.g., '1h 18m')
    - breakdown: How the time is calculated
    """
    
    prediction: float = Field(..., description="Predicted journey time in MINUTES")
    duration_readable: str = Field(..., description="Human-readable duration (e.g., '1h 18m')")
    input_distance: float
    input_num_stops: int
    breakdown: dict = Field(..., description="Time breakdown details")
    note: str = Field(..., description="Calculation formula used")

@app.get("/", tags=["Health"])
def health_check():
    """API health check endpoint"""
    status = "🟢 READY" if model is not None else "🔴 MODEL NOT LOADED"
    return {
        "message": "Train Time Prediction API is running",
        "status": status,
        "model_loaded": model is not None
    }

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(data: PredictionRequest):
    """
    Predict train journey time using distance and number of stops.
    
    Formula: time = (distance/60 + num_stops*5) * 1.10
    - Base speed: 60 km/h (average train)
    - Dwell time: 5 min per stop
    - Contingency: 10% for delays
    
    Example request:
    {
        "distance": 78,
        "num_stops": 3
    }
    """
    
    try:
        # Calculation parameters (based on Indian train patterns)
        AVG_SPEED_KMH = 60
        DWELL_TIME_PER_STOP = 5
        CONTINGENCY_FACTOR = 1.10
        
        # Base travel time
        base_travel_minutes = (data.distance / AVG_SPEED_KMH) * 60
        
        # Dwell time at stops
        stops_dwell_minutes = data.num_stops * DWELL_TIME_PER_STOP
        
        # Total without contingency
        total_base = base_travel_minutes + stops_dwell_minutes
        
        # Apply contingency
        prediction_minutes = total_base * CONTINGENCY_FACTOR
        
        # Convert to readable format
        hours = int(prediction_minutes // 60)
        minutes = int(prediction_minutes % 60)
        duration_readable = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        # Breakdown
        breakdown = {
            "base_travel_time_minutes": round(base_travel_minutes, 1),
            "stops_dwell_time_minutes": stops_dwell_minutes,
            "subtotal_minutes": round(total_base, 1),
            "contingency_10_percent_minutes": round(total_base * 0.10, 1),
            "total_predicted_minutes": round(prediction_minutes, 1)
        }
        
        logger.info(
            f"Prediction: {data.distance}km + {data.num_stops} stops = {duration_readable}"
        )
        
        return PredictionResponse(
            prediction=prediction_minutes,
            duration_readable=duration_readable,
            input_distance=data.distance,
            input_num_stops=data.num_stops,
            breakdown=breakdown,
            note=f"({data.distance}km/60kmh) + ({data.num_stops}×5min) × 1.10 = {duration_readable}"
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Prediction failed",
                "message": str(e),
                "status": 500
            }
        )

# =============================================================================
# FUTURE ENDPOINTS (To implement for real-world system)
# =============================================================================

# @app.get("/trains", tags=["Data"])
# def get_trains():
#     """List all available trains"""
#     pass

# @app.get("/stations", tags=["Data"])
# def get_stations():
#     """List all stations on the network"""
#     pass

# @app.get("/routes", tags=["Data"])
# def get_routes():
#     """List all train routes with distances"""
#     pass

# @app.post("/predict_advanced", tags=["Prediction"])
# def predict_advanced(train_number: int, source: str, destination: str, time: str):
#     """Advanced prediction using actual timetable data"""
#     pass

