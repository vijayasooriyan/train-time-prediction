import { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('Hello World!');

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await fetch('http://localhost:3000/');
        const text = await res.text();
        setMessage(text);
      } catch (err) {
        console.error('Error:', err);
        setMessage('Hello World!');
      }
    };
    fetchMessage();
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '48px', fontWeight: 'bold' }}>
      {message}
    </div>
  );
}

export default App;
