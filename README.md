# 🚂 Train Time Prediction Platform

A **full-stack Machine Learning application** that predicts train journey times based on distance and number of stops.

**What it does:** Enter distance (km) and stops → Get predicted journey time in hours/minutes

**Tech Stack:** React (Frontend) → NestJS (Backend) → FastAPI (ML Server)

**Status:** ✅ Working | ✅ Documented | ✅ Learning Project

---

## 📋 Quick Links

- [What is This?](#what-is-this)
- [Quick Start (5 min)](#quick-start-5-min)
- [How It Works](#how-it-works)
- [Setup Instructions](#setup-instructions)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Troubleshooting](#troubleshooting)

---

## 🎯 What is This?

This is a **learning project** showing how to build a real-world ML application with 3 separate layers:

```
User Interface (React)
        ↓
Business Logic (NestJS)
        ↓
ML Predictions (FastAPI + scikit-learn Model)
```

**Example:** User enters 78km + 3 stops → System predicts 1h 18m journey time

---

## 🚀 Quick Start (5 min)

### Everything at Once

```powershell
# Just open 1 PowerShell and run this:
.\start_all.ps1
```

This starts:
1. **Python ML Server** on http://localhost:8000
2. **NestJS Backend** on http://localhost:5000  
3. **React Frontend** on http://localhost:3000

Then open **http://localhost:3000** in your browser.

### Manual Setup (3 Terminals)

**Terminal 1 - Python (ML Model):**
```bash
pip install fastapi uvicorn pydantic joblib numpy scikit-learn
uvicorn app:app --reload
# Waits for requests on port 8000
```

**Terminal 2 - Backend (Routing & Validation):**
```bash
cd backend
npm install  # First time only
npm run start:dev
# Runs on port 5000
```

**Terminal 3 - Frontend (User Interface):**
```bash
cd frontend
npm install  # First time only
npm start
# Opens http://localhost:3000 automatically
```

### Test It Works

1. In your browser at http://localhost:3000:
   - Distance: `78` km
   - Stops: `3`
   - Click "🔮 Predict Duration"
   - Should show **1h 18m** ✓

2. Try invalid data:
   - Distance: `5000` km
   - Should show error: "Distance: 1-2000 km" ✓

---

## 🏗️ How It Works

### The 3 Layers

```
┌─────────────────────────────────┐
│  FRONTEND (React)               │
│  What: User interface with      │
│        input form & results     │
│  Port: 3000                     │
│  Does: Validates input, shows   │
│        loading spinner, displays│
│        results to user          │
└────────────┬────────────────────┘
             │
             │ POST /prediction
             │ {distance: 78, stops: 3}
             ↓
┌─────────────────────────────────┐
│  BACKEND (NestJS)               │
│  What: Gateway between frontend │
│        and ML server            │
│  Port: 5000                     │
│  Does: Validates input again,   │
│        forwards to ML, formats  │
│        response back            │
└────────────┬────────────────────┘
             │
             │ POST /predict (to Python)
             ↓
┌─────────────────────────────────┐
│  ML SERVER (FastAPI)            │
│  What: Python server with       │
│        trained ML model         │
│  Port: 8000                     │
│  Does: Loads model, calculates  │
│        prediction, returns time │
└─────────────────────────────────┘
```

### Step-by-Step Flow

1. **User enters:** Distance=78km, Stops=3
2. **Frontend validates:** Is distance between 1-2000? Is stops between 1-100?
3. **Frontend sends:** JSON to http://localhost:5000/prediction
4. **Backend validates:** Double-checks the numbers again
5. **Backend forwards:** Sends to http://localhost:8000/predict (Python)
6. **ML Model calculates:**
   - `Time = (0.6 × distance) + (2.1 × stops) + 5`
   - `Time = (0.6 × 78) + (2.1 × 3) + 5 = 78.5 minutes`
7. **Backend formats:** Returns nicely formatted response
8. **Frontend displays:** Shows "1h 18m" to user with animations

---

## 📦 Setup Instructions

### Prerequisites

- **Node.js**: v18 or higher (download from nodejs.org)
- **Python**: v3.8 or higher (download from python.org)
- **npm**: comes with Node.js

### Installation Steps

**1. Python Dependencies**
```bash
pip install fastapi uvicorn pydantic joblib numpy scikit-learn
```

**2. Backend (NestJS)**
```bash
cd backend
npm install
```

**3. Frontend (React)**
```bash
cd frontend
npm install
```

**4. Verify Model File**
```bash
# Make sure train_model.pkl exists in root folder
dir train_model.pkl
```

**5. Start Everything**
```bash
.\start_all.ps1
```

---

## 📡 API Reference

### URL
```
POST http://localhost:5000/prediction
```

### Send This

```json
{
  "distance": 78,
  "num_stops": 3,
  "train_number": 107
}
```

**Required:** distance, num_stops  
**Optional:** train_number

### Validation Rules

| Field | Min | Max | Example |
|-------|-----|-----|---------|
| distance | 1 | 2000 | 78 |
| num_stops | 1 | 100 | 3 |
| train_number | - | - | 107 |

### Get Back (Success)

```json
{
  "prediction": 78.5,
  "duration_readable": "1h 18m",
  "input_distance": 78,
  "input_num_stops": 3,
  "breakdown": {
    "distance_coefficient": 0.6,
    "stops_coefficient": 2.1,
    "intercept": 5.0,
    "distance_contribution_minutes": 46.8,
    "stops_contribution_minutes": 6.3,
    "total_predicted_minutes": 78.5
  },
  "note": "Formula: 0.6×Distance + 2.1×Stops + 5"
}
```

### Error Examples

**Bad distance (too high):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "details": [
    {
      "field": "distance",
      "message": "Distance must be between 1 and 2000 km",
      "received_value": 5000
    }
  ]
}
```

**ML Server not running:**
```json
{
  "statusCode": 503,
  "message": "ML service unavailable"
}
```

---

## 📁 Project Structure

```
Train time prediction project/
│
├── app.py                    ← Python FastAPI server ⭐
├── train_model.pkl           ← ML model (trained)
├── Dataset1.csv              ← Training data (reference)
├── LEARNING_GUIDE.md         ← Study material for learning
│
├── backend/                  ← NestJS Server
│   ├── src/
│   │   ├── main.ts          ← Starts server on port 5000 ⭐
│   │   ├── app.module.ts    ← Module setup
│   │   └── prediction/      ← Prediction endpoints
│   │       ├── prediction.controller.ts
│   │       ├── prediction.service.ts
│   │       └── dto/prediction.dto.ts
│   └── package.json
│
├── frontend/                 ← React UI
│   ├── public/
│   │   └── index.html       ← HTML template
│   ├── src/
│   │   ├── App.js           ← Main component ⭐
│   │   ├── App.css          ← Styling & animations
│   │   └── index.js         ← React entry point
│   └── package.json
│
├── README.md                 ← This file
└── start_all.ps1            ← One-click startup script
```

---

## 💻 Technology Stack

### Frontend
- **React** - User interface
- **GSAP** - Smooth animations
- **Fetch API** - HTTP requests
- **CSS** - Styling

### Backend
- **NestJS** - Web framework
- **TypeScript** - Type safety
- **Axios** - HTTP client

### ML / Python
- **FastAPI** - Web framework
- **scikit-learn** - ML library
- **Joblib** - Model loading
- **Pydantic** - Data validation

---

## 🔧 Troubleshooting

### Issue: Port Already in Use

```bash
# Solution: Use the startup script (kills existing processes)
.\start_all.ps1

# Or manually:
netstat -ano | findstr :5000
taskkill /PID [PID] /F
```

### Issue: "Module 'fastapi' not found"

```bash
pip install fastapi uvicorn pydantic joblib numpy scikit-learn
```

### Issue: "train_model.pkl not found"

```bash
# Check if file exists
dir train_model.pkl

# If missing, you need to train it first
# The file should be in the root project folder
```

### Issue: Frontend Can't Connect to Backend

✓ Restart backend: `npm run start:dev` in backend/  
✓ Wait 5 seconds before starting frontend  
✓ Check URL in App.js is http://localhost:5000/prediction  
✓ Check NestJS is running on port 5000: `netstat -ano | findstr :5000`

### Issue: Predictions are Slow

✓ Make sure Python API is running on port 8000  
✓ Check Python console for errors  
✓ Model should load in ~1 second on startup

---

## 📚 Learning This Project

**New to coding?** Read [LEARNING_GUIDE.md](LEARNING_GUIDE.md) first!

It explains:
- How full-stack projects work
- API requests/responses
- React state management
- ML model serving
- Error handling
- And more...

---

## 🎯 Real Example Calculations

### Example 1: Short Trip
```
Input:  78 km, 3 stops
Formula: (0.6 × 78) + (2.1 × 3) + 5
Result: 46.8 + 6.3 + 5 = 58.1 minutes ≈ 58 min
```

### Example 2: Long Distance
```
Input:  500 km, 15 stops
Formula: (0.6 × 500) + (2.1 × 15) + 5
Result: 300 + 31.5 + 5 = 336.5 minutes ≈ 5h 37m
```

### Example 3: Express Train
```
Input:  200 km, 2 stops
Formula: (0.6 × 200) + (2.1 × 2) + 5
Result: 120 + 4.2 + 5 = 129.2 minutes ≈ 2h 9m
```

---

## ✅ Checklist Before Using

- [ ] Node.js installed (check: `node --version`)
- [ ] Python installed (check: `python --version`)
- [ ] `train_model.pkl` exists in root folder
- [ ] Run `.\start_all.ps1` or start 3 terminals
- [ ] All 3 services show no errors
- [ ] Can open http://localhost:3000
- [ ] Predictions work with valid input
- [ ] Error messages show with invalid input

---

## 🚀 Next Steps

**Want to extend this?**

1. Add database to save predictions
2. Add authentication (login required)
3. Train a better ML model
4. Add more features (weather, train type, etc.)
5. Deploy to cloud (Heroku, AWS, etc.)

**Want to learn more?**

1. Read LEARNING_GUIDE.md
2. Modify frontend styling
3. Change validation rules  
4. Explore how React components work
5. Learn how ML models make predictions

---

## 📞 Quick Reference

| Service | URL | Port | Start Command |
|---------|-----|------|----------------|
| Frontend | http://localhost:3000 | 3000 | `npm start` (in frontend/) |
| Backend | http://localhost:5000 | 5000 | `npm run start:dev` (in backend/) |
| ML API | http://localhost:8000 | 8000 | `uvicorn app:app --reload` |

One-click start:
```bash
.\start_all.ps1
```

---

**Made for learning full-stack ML development** 🚂✨

Last Updated: March 23, 2026

