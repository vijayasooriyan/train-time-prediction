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
    
    Real-world fields to add:
    - train_number: Which specific train (e.g., 107, 128 from Dataset1.csv)
    - route_id: Route identifier
    - departure_timestamp: When train departs (not just distance/speed)
    """
    
    distance: float = Field(..., gt=0, le=2000, description="Distance in km (1-2000)")
    speed: float = Field(..., gt=20, lt=200, description="Average speed km/h (20-200)")
    train_number: Optional[int] = Field(None, description="Optional: Train number (e.g., 107, 128)")
    source_station: Optional[str] = Field(None, description="Optional: Source station code")
    dest_station: Optional[str] = Field(None, description="Optional: Destination station code")
    departure_time: Optional[str] = Field(None, description="Optional: Departure time (HH:MM format)")

    @validator('distance')
    def validate_distance(cls, v):
        if v <= 0:
            raise ValueError('Distance must be positive')
        if v > 2000:
            raise ValueError('Distance cannot exceed 2000 km (unrealistic for single train journey)')
        return v

    @validator('speed')
    def validate_speed(cls, v):
        # Realistic train speeds
        # Local trains: 40-60 km/h
        # Express trains: 80-120 km/h
        # High-speed: 200+ km/h (rare in India)
        if v < 20 or v > 200:
            raise ValueError('Speed must be between 20-200 km/h')
        return v

class PredictionResponse(BaseModel):
    """
    Response from prediction model.
    
    ⚠️ CLARITY ISSUE IN ORIGINAL:
    What does 'prediction' mean?
    - Answer: Journey time in MINUTES (distance / speed simplified calculation)
    
    Real-world response should include:
    - ETA (Estimated Time of Arrival)
    - Confidence level
    - Delay factors
    """
    
    prediction: float = Field(..., description="Predicted journey time in MINUTES")
    duration_readable: str = Field(..., description="Human-readable duration (e.g., '1h 18m')")
    input_distance: float
    input_speed: float
    note: str = Field(..., description="Clarification about what prediction means")

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
    Predict train journey time.
    
    Current Formula: time (minutes) = distance (km) / (speed (km/h) / 60)
    
    Returns:
    - prediction: Journey duration in MINUTES
    - Other fields for clarity and future expansion
    
    Example request:
    {
        "distance": 78,
        "speed": 60,
        "train_number": 107
    }
    
    Example response:
    {
        "prediction": 78.0,
        "duration_readable": "1h 18m",
        "input_distance": 78,
        "input_speed": 60,
        "note": "Based on distance and average speed. Real implementation should use actual timetables."
    }
    """
    
    # Check model is loaded
    if model is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Model not loaded",
                "message": "ML model could not be loaded. Check if train_model.pkl exists.",
                "status": 503
            }
        )
    
    try:
        # Create feature array for model [distance, speed]
        features = np.array([[data.distance, data.speed]])
        
        # Get prediction from model
        prediction_minutes = float(model.predict(features)[0])
        
        # Convert to readable format
        hours = int(prediction_minutes // 60)
        minutes = int(prediction_minutes % 60)
        duration_readable = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        # Log prediction for monitoring
        logger.info(
            f"Prediction: {data.distance}km @ {data.speed}km/h = {prediction_minutes:.1f} min"
        )
        
        return PredictionResponse(
            prediction=prediction_minutes,
            duration_readable=duration_readable,
            input_distance=data.distance,
            input_speed=data.speed,
            note="⚠️ This is a basic model using simple distance/speed calculation. "
                 "Real implementation should incorporate timetables, stop durations, "
                 "and historical patterns from Dataset1.csv"
        )
        
    except Exception as e:
        logger.error(f"✗ Prediction error: {str(e)}")
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

