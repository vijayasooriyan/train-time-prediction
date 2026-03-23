import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import "./App.css";

function App() {
  const [distance, setDistance] = useState("");
  const [numStops, setNumStops] = useState("");
  const [trainNumber, setTrainNumber] = useState("");
  const [result, setResult] = useState("");
  const [fullResponse, setFullResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
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
  }, []);

  const validateInputs = () => {
    const errors = [];

    if (!distance || isNaN(distance)) {
      errors.push("Distance required");
    } else if (Number(distance) <= 0 || Number(distance) > 2000) {
      errors.push("Distance: 1-2000 km");
    }

    if (!numStops || isNaN(numStops)) {
      errors.push("Stops required");
    } else if (Number(numStops) < 1 || Number(numStops) > 100) {
      errors.push("Stops: 1-100");
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

      const res = await fetch("http://localhost:5000/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || `Error: ${res.status}`);
      }

      const data = await res.json();
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
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    setDistance("78");
    setNumStops("3");
    setTrainNumber("107");
    setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
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
          
        </div>

        <div className="card" ref={cardRef}>
          <div className="card-content">
            <div className="input-group">
              <div className="input-wrapper">
                <label htmlFor="distance" className="label">Distance (km)</label>
                <div className="input-container">
                  <span className="input-icon">📍</span>
                  <input
                    id="distance"
                    className="input-field"
                    type="number"
                    placeholder="e.g., 78"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    onKeyPress={handleKeyPress}
                    min="1"
                    max="2000"
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label htmlFor="numStops" className="label">Number of Stops</label>
                <div className="input-container">
                  <span className="input-icon">🛑</span>
                  <input
                    id="numStops"
                    className="input-field"
                    type="number"
                    placeholder="e.g., 3"
                    value={numStops}
                    onChange={(e) => setNumStops(e.target.value)}
                    onKeyPress={handleKeyPress}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label htmlFor="trainNumber" className="label">Train Number</label>
                <div className="input-container">
                  <span className="input-icon">🚂</span>
                  <input
                    id="trainNumber"
                    className="input-field"
                    type="number"
                    placeholder="e.g., 107"
                    value={trainNumber}
                    onChange={(e) => setTrainNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button
                className={`predict-button ${loading ? "loading" : ""}`}
                onClick={predict}
                disabled={loading}
              >
                {loading ? <>
                    <span className="spinner"></span>
                    Calculating...
                  </> : "🔮 Predict Duration"
                }
              </button>
              
              
            </div>

            {result && fullResponse && (
              <div className="result-section" ref={resultRef}>
                <div className="result-card">
                  <h2 className="result-label">⏱️ Predicted Duration</h2>
                  
                  <div className="result-value">
                    <span className="time-number">{formatDuration(result)}</span>
                  </div>

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

                  {/* {fullResponse.factors && fullResponse.factors.length > 0 && (
                    <div className="factors-section">
                      <small className="factors-label">Travel Factors:</small>
                      <ul className="factors-list">
                        {fullResponse.factors.map((factor, idx) => (
                          <li key={idx}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )} */}

                  {/* {fullResponse.note && (
                    <div className="note-section">
                      <small>ℹ️ {fullResponse.note}</small>
                    </div>
                  )} */}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="footer">
          <p>🚆 Train Prediction Engine • 📊 Distance + Stops = Duration ⏱️</p>
        </div>
      </div>
    </div>
  );
}

export default App;
