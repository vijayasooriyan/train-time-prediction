import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import "./App.css";

/**
 * Train Time Prediction App
 * 
 * Uses Distance + Number of Stops to predict journey duration
 * Formula: (distance/60 + num_stops*5) * 1.10 minutes
 */

function App() {
  const [distance, setDistance] = useState("");
  const [numStops, setNumStops] = useState("");
  const [trainNumber, setTrainNumber] = useState("");
  const [result, setResult] = useState("");
  const [fullResponse, setFullResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serverStatus, setServerStatus] = useState(null);
  
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const resultRef = useRef(null);
  const trainRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );

    if (trainRef.current) {
      gsap.to(trainRef.current, {
        x: 10,
        duration: 0.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }

    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const res = await fetch("http://localhost:3000/", {
        method: "GET",
        timeout: 2000
      });
      setServerStatus(res.ok ? "online" : "offline");
    } catch (err) {
      setServerStatus("offline");
    }
  };

  const validateInputs = () => {
    const errors = [];

    if (!distance || isNaN(distance)) {
      errors.push("Distance is required (e.g., 78 km)");
    } else if (Number(distance) <= 0) {
      errors.push("Distance must be positive");
    } else if (Number(distance) > 2000) {
      errors.push("Distance cannot exceed 2000 km");
    }

    if (!numStops || isNaN(numStops)) {
      errors.push("Number of stops is required (e.g., 3)");
    } else if (Number(numStops) < 1) {
      errors.push("Number of stops must be at least 1");
    } else if (Number(numStops) > 100) {
      errors.push("Number of stops cannot exceed 100");
    }

    if (trainNumber && (isNaN(trainNumber) || Number(trainNumber) < 100)) {
      errors.push("Train number should be 3+ digits (e.g., 107, 128)");
    }

    return errors;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const predict = async () => {
    const validationErrors = validateInputs();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" • "));
      return;
    }

    setError("");
    setLoading(true);
    setResult("");
    setFullResponse(null);

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    }

    try {
      const payload = {
        distance: Number(distance),
        num_stops: Number(numStops),
      };

      if (trainNumber.trim()) {
        payload.train_number = Number(trainNumber);
      }

      const res = await fetch("http://localhost:3000/prediction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || 
          errorData.error || 
          `Server error: ${res.status}`
        );
      }

      const data = await res.json();
      
      if (!data.prediction || typeof data.prediction !== 'number') {
        throw new Error("Invalid response format from server");
      }

      setResult(data.prediction);
      setFullResponse(data);

      if (resultRef.current) {
        gsap.fromTo(
          resultRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "back.out" }
        );
      }

    } catch (err) {
      console.error("Prediction error:", err);
      
      if (err.message.includes("Failed to fetch")) {
        setError("❌ Cannot connect to backend. Services running?\n" +
                 "1. NestJS: npm run start:dev\n" +
                 "2. Python API: uvicorn app:app --reload");
      } else if (err.message.includes("Validation failed")) {
        setError("❌ Invalid input: " + err.message);
      } else {
        setError(`❌ ${err.message || "Unknown error"}`);
      }

      setServerStatus("offline");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value, setter) => {
    setter(value);
    setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      predict();
    }
  };

  return (
    <div className="app-container" ref={containerRef}>
      <div className="background-animation">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>

      <div className="content-wrapper">
        <div className="header">
          <div className="train-icon" ref={trainRef}>🚆</div>
          <h1 className="title">Train Time Predictor</h1>
          <p className="subtitle">Distance + Stops = Duration</p>
          {serverStatus && (
            <div className={`server-status ${serverStatus}`}>
              {serverStatus === "online" ? "✓ Services Running" : "✗ Services Offline"}
            </div>
          )}
        </div>

        <div className="card" ref={cardRef}>
          <div className="card-content">
            <div className="info-box">
              <p>
                💡 <strong>How it works:</strong> Enter the distance and number of stops 
                to predict the train journey duration.
                <br/>
                <em>Formula:</em> (Distance÷60 + Stops×5) × 1.10 minutes
              </p>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <label htmlFor="distance" className="label">
                  Distance <span className="unit">(km)</span>
                </label>
                <div className="input-container">
                  <span className="input-icon">📍</span>
                  <input
                    id="distance"
                    className="input-field"
                    type="number"
                    placeholder="e.g., 78"
                    value={distance}
                    onChange={(e) => handleInputChange(e.target.value, setDistance)}
                    onKeyPress={handleKeyPress}
                    min="1"
                    max="2000"
                  />
                </div>
                <small className="hint">1-2000 km between start & end stations</small>
              </div>

              <div className="input-wrapper">
                <label htmlFor="numStops" className="label">
                  Number of Stops <span className="unit">(count)</span>
                </label>
                <div className="input-container">
                  <span className="input-icon">🛑</span>
                  <input
                    id="numStops"
                    className="input-field"
                    type="number"
                    placeholder="e.g., 3"
                    value={numStops}
                    onChange={(e) => handleInputChange(e.target.value, setNumStops)}
                    onKeyPress={handleKeyPress}
                    min="1"
                    max="100"
                  />
                </div>
                <small className="hint">Express: 2-8 • Local: 10-30 stops</small>
              </div>

              <div className="input-wrapper">
                <label htmlFor="trainNumber" className="label">
                  Train # <span className="unit">(Optional)</span>
                </label>
                <div className="input-container">
                  <span className="input-icon">🚂</span>
                  <input
                    id="trainNumber"
                    className="input-field"
                    type="number"
                    placeholder="e.g., 107"
                    value={trainNumber}
                    onChange={(e) => handleInputChange(e.target.value, setTrainNumber)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <small className="hint">e.g., 107, 128 from dataset</small>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className={`predict-button ${loading ? "loading" : ""}`}
              onClick={predict}
              disabled={loading || serverStatus === "offline"}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Calculating...
                </>
              ) : (
                "🔮 Predict Duration"
              )}
            </button>

            {result && fullResponse && (
              <div className="result-section" ref={resultRef}>
                <div className="result-card">
                  <h2 className="result-label">⏱️ Predicted Duration</h2>
                  
                  <div className="result-value">
                    <span className="time-number">{formatDuration(result)}</span>
                    <span className="time-unit">Journey Time</span>
                  </div>

                  {fullResponse.breakdown && (
                    <div className="breakdown-section">
                      <small className="breakdown-label">Time Breakdown:</small>
                      <div className="breakdown-details">
                        <div className="breakdown-item">
                          <span>Base Travel (Dist÷60):</span>
                          <strong>{fullResponse.breakdown.base_travel_time_minutes} min</strong>
                        </div>
                        <div className="breakdown-item">
                          <span>Stops (Stops×5):</span>
                          <strong>{fullResponse.breakdown.stops_dwell_time_minutes} min</strong>
                        </div>
                        <div className="breakdown-item">
                          <span>Subtotal:</span>
                          <strong>{fullResponse.breakdown.subtotal_minutes} min</strong>
                        </div>
                        <div className="breakdown-item">
                          <span>+ Contingency (10%):</span>
                          <strong>+{fullResponse.breakdown.contingency_10_percent_minutes} min</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="result-details">
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{distance} km</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🛑</span>
                      <span>{numStops} stops</span>
                    </div>
                    {trainNumber && (
                      <div className="detail-item">
                        <span className="detail-icon">🚂</span>
                        <span>Train #{trainNumber}</span>
                      </div>
                    )}
                  </div>

                  {fullResponse.factors && fullResponse.factors.length > 0 && (
                    <div className="factors-section">
                      <small className="factors-label">Travel Factors:</small>
                      <ul className="factors-list">
                        {fullResponse.factors.map((factor, idx) => (
                          <li key={idx}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fullResponse.note && (
                    <div className="note-section">
                      <small>ℹ️ {fullResponse.note}</small>
                    </div>
                  )}

                  {fullResponse.timestamp && (
                    <div className="timestamp">
                      <small>Predicted: {new Date(fullResponse.timestamp).toLocaleTimeString()}</small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="footer">
          <p>🚆 Train Prediction Engine • 📊 Distance + Stops = Duration ⏱️</p>
          <p style={{ fontSize: "0.8em", marginTop: "10px", opacity: 0.7 }}>
            <em>Formula: (Distance/60km/h + Stops×5min) × 1.10 contingency factor</em>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
