import React, { useState, useEffect } from 'react';
import './App.css'; // Make sure this file exists

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>TrackGuide</h1>
        <p>Your AI Music Production Assistant</p>
        <div>
          <button 
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Count: {count}
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </header>
    </div>
  );
};

export default App;