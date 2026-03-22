import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import "./App.css";

/**
 * Train Time Prediction App
 * 
 * LOGIC NOTES:
 * - Currently predicts journey time using simple distance/speed calculation
 * - Real-world improvement: Use actual train numbers and schedules
 * - Response now includes ETA, confidence, and factors affecting travel
 */

function App() {
  const [distance, setDistance] = useState("");
  const [speed, setSpeed] = useState("");
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

  // Animate on mount
  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );

    // Train icon animation
    if (trainRef.current) {
      gsap.to(trainRef.current, {
        x: 10,
        duration: 0.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }

    // Check server status on mount
    checkServerStatus();
  }, []);

  /**
   * Check if backend services are running
   * Shows user-friendly message if not
   */
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

  /**
   * Validate input parameters
   * Real-world constraints for train predictions
   */
  const validateInputs = () => {
    const errors = [];

    // Distance validation
    if (!distance || isNaN(distance)) {
      errors.push("Distance is required (e.g., 78 km)");
    } else if (Number(distance) <= 0) {
      errors.push("Distance must be positive");
    } else if (Number(distance) > 2000) {
      errors.push("Distance cannot exceed 2000 km");
    }

    // Speed validation
    if (!speed || isNaN(speed)) {
      errors.push("Speed (Average train speed) is required (e.g., 60 km/h)");
    } else if (Number(speed) < 20) {
      errors.push("Speed seems too slow (minimum 20 km/h)");
    } else if (Number(speed) > 200) {
      errors.push("Speed seems too high (maximum 200 km/h)");
    }

    // Train number validation (optional)
    if (trainNumber && (isNaN(trainNumber) || Number(trainNumber) < 100)) {
      errors.push("Train number should be 3+ digits (e.g., 107, 128)");
    }

    return errors;
  };

  /**
   * Format duration from minutes to readable format
   * e.g., 78 minutes → "1h 18m"
   */
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  /**
   * Main prediction function
   */
  const predict = async () => {
    // Validate inputs
    const validationErrors = validateInputs();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" • "));
      return;
    }

    setError("");
    setLoading(true);
    setResult("");
    setFullResponse(null);

    // Animate button click
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    }

    try {
      // Build request payload
      const payload = {
        distance: Number(distance),
        speed: Number(speed),
      };

      if (trainNumber.trim()) {
        payload.train_number = Number(trainNumber);
      }

      // Call backend API
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
      
      // Handle response
      if (!data.prediction || typeof data.prediction !== 'number') {
        throw new Error("Invalid response format from server");
      }

      setResult(data.prediction);
      setFullResponse(data);

      // Animate result appearance
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
        setError("❌ Cannot connect to backend. Make sure both services are running:\n" +
                 "1. NestJS: npm run start (in backend/)\n" +
                 "2. Python API: uvicorn app:app --reload");
      } else if (err.message.includes("Validation failed")) {
        setError("❌ Invalid input: " + err.message);
      } else {
        setError(`❌ ${err.message || "Unknown error occurred"}`);
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
      {/* Animated background */}
      <div className="background-animation">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>

      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <div className="train-icon" ref={trainRef}>🚆</div>
          <h1 className="title">Train Time Predictor</h1>
          <p className="subtitle">Predict travel time with AI precision</p>
          {serverStatus && (
            <div className={`server-status ${serverStatus}`}>
              {serverStatus === "online" ? "✓ Services Running" : "✗ Services Offline"}
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="card" ref={cardRef}>
          <div className="card-content">
            {/* Info Box */}
            <div className="info-box">
              <p>
                💡 <strong>How it works:</strong> Enter distance and average train speed 
                to predict the journey duration. 
                <br/>
                <em>Optional:</em> Add train number for more accurate predictions.
              </p>
            </div>

            {/* Input Section */}
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
                <small className="hint">Between 1-2000 km</small>
              </div>

              <div className="input-wrapper">
                <label htmlFor="speed" className="label">
                  Avg Speed <span className="unit">(km/h)</span>
                </label>
                <div className="input-container">
                  <span className="input-icon">⚡</span>
                  <input
                    id="speed"
                    className="input-field"
                    type="number"
                    placeholder="e.g., 60"
                    value={speed}
                    onChange={(e) => handleInputChange(e.target.value, setSpeed)}
                    onKeyPress={handleKeyPress}
                    min="20"
                    max="200"
                  />
                </div>
                <small className="hint">Local: 40-60 • Express: 80-120</small>
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
                <small className="hint">For better accuracy</small>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Button */}
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
                "🔮 Predict Travel Time"
              )}
            </button>

            {/* Result Section - Enhanced */}
            {result && fullResponse && (
              <div className="result-section" ref={resultRef}>
                <div className="result-card">
                  <h2 className="result-label">📊 Prediction Results</h2>
                  
                  {/* Main Duration */}
                  <div className="result-value">
                    <span className="time-number">{formatDuration(result)}</span>
                    <span className="time-unit">Expected Duration</span>
                  </div>

                  {/* Meta Information */}
                  {fullResponse.eta && (
                    <div className="meta-section">
                      <div className="meta-item">
                        <span className="meta-icon">🕐</span>
                        <div>
                          <small>Estimated Arrival</small>
                          <strong>{fullResponse.eta}</strong>
                        </div>
                      </div>
                      
                      {fullResponse.confidence && (
                        <div className="meta-item">
                          <span className="meta-icon">📈</span>
                          <div>
                            <small>Confidence</small>
                            <strong>{Math.round(fullResponse.confidence * 100)}%</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Echo */}
                  <div className="result-details">
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{distance} km</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⚡</span>
                      <span>{speed} km/h</span>
                    </div>
                    {trainNumber && (
                      <div className="detail-item">
                        <span className="detail-icon">🚂</span>
                        <span>Train #{trainNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Delay Factors */}
                  {fullResponse.factors && fullResponse.factors.length > 0 && (
                    <div className="factors-section">
                      <small className="factors-label">Factors affecting travel:</small>
                      <ul className="factors-list">
                        {fullResponse.factors.map((factor, idx) => (
                          <li key={idx}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Note about model */}
                  {fullResponse.note && (
                    <div className="note-section">
                      <small>ℹ️ {fullResponse.note}</small>
                    </div>
                  )}

                  {/* Timestamp */}
                  {fullResponse.timestamp && (
                    <div className="timestamp">
                      <small>Calculated: {new Date(fullResponse.timestamp).toLocaleTimeString()}</small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>🤖 Powered by ML • 📊 Real-time Predictions • 🚆 Train Intelligence</p>
          <p style={{ fontSize: "0.8em", marginTop: "10px", opacity: 0.7 }}>
            <em>Note: Currently uses distance/speed model. Real-world system should use actual timetables.</em>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;