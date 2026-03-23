from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Train Time Prediction API",
    version="1.0.0"
)

model = None

@app.on_event("startup")
async def load_model():
    global model
    try:
        model = joblib.load('train_model.pkl')
        logger.info("✓ ML model loaded")
    except Exception as e:
        logger.error(f"✗ Model load error: {e}")
        model = None

class PredictionRequest(BaseModel):
    distance: float = Field(..., gt=0, le=2000, description="Distance in km (1-2000)")
    num_stops: int = Field(..., ge=1, le=100, description="Number of stops (1-100)")
    train_number: int = Field(None, description="Train number (optional)")

class PredictionResponse(BaseModel):
    prediction: float
    duration_readable: str
    input_distance: float
    input_num_stops: int
    breakdown: dict
    note: str

@app.post("/predict", response_model=PredictionResponse)
def predict(data: PredictionRequest):
    global model
    
    try:
        if model is None:
            raise HTTPException(
                status_code=503,
                detail={"error": "Model not loaded"}
            )
        
        features = np.array([[data.distance, data.num_stops]])
        model_prediction = model.predict(features)[0]
        
        hours = int(model_prediction // 60)
        minutes = int(model_prediction % 60)
        duration_readable = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        distance_coef = float(model.coef_[0])
        stops_coef = float(model.coef_[1])
        intercept = float(model.intercept_)
        
        distance_contribution = data.distance * distance_coef
        stops_contribution = data.num_stops * stops_coef
        
        breakdown = {
            "distance_coefficient": round(distance_coef, 6),
            "stops_coefficient": round(stops_coef, 6),
            "intercept": round(intercept, 6),
            "distance_contribution_minutes": round(distance_contribution, 1),
            "stops_contribution_minutes": round(stops_contribution, 1),
            "total_predicted_minutes": round(model_prediction, 1)
        }
        
        logger.info(f"Prediction: {data.distance}km + {data.num_stops} stops = {duration_readable}")
        
        return PredictionResponse(
            prediction=model_prediction,
            duration_readable=duration_readable,
            input_distance=data.distance,
            input_num_stops=data.num_stops,
            breakdown=breakdown,
            note=f"Formula: {distance_coef:.4f}×Distance + {stops_coef:.4f}×Stops + {intercept:.4f}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

