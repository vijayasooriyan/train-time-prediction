# Train Time Prediction Project

A full-stack machine learning application for predicting train travel times.

## Project Structure

- **app.py** - Python FastAPI for ML model serving
- **backend/** - NestJS backend framework
- **frontend/** - React frontend UI
- **Dataset1.csv** - Training data

## Setup Instructions

### Backend (Python)
```bash
pip install fastapi joblib numpy uvicorn
uvicorn app:app --reload
```

### Backend (Node.js/NestJS)
```bash
cd backend
npm install
npm run start
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `GET /` - Health check
- `POST /predict` - Make predictions with distance and speed parameters

## Features

- Real-time ML predictions
- RESTful API architecture
- React-based user interface
- NestJS backend framework

## Contributors

- Vijayasooriyan K
