import { useState } from "react";

function App() {
  const [distance, setDistance] = useState("");
  const [speed, setSpeed] = useState("");
  const [result, setResult] = useState("");

  const predict = async () => {
    const res = await fetch("http://localhost:3000/prediction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        distance: Number(distance),
        speed: Number(speed)
      })
    });

    const data = await res.json();
    setResult(data.prediction);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>🚆 Train Time Prediction</h2>

      <input
        placeholder="Distance"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Speed"
        value={speed}
        onChange={(e) => setSpeed(e.target.value)}
      />
      <br /><br />

      <button onClick={predict}>Predict</button>

      <h3>Result: {result}</h3>
    </div>
  );
}

export default App;