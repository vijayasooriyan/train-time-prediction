from fastapi import FastAPI
import joblib
import numpy as np

app=FastAPI()

#load model
try:
    model = joblib.load('train_model.pkl')
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.get("/")
def home():
    return {"message":"ML api is running"}

@app.post("/predict")
def predict(data:dict):
    features = np.array([[data['distance'],data['speed']]])

    prediction = model.predict(features)

    return {"prediction": float(prediction[0])}
