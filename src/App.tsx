// src/App.tsx
import React, { useState } from 'react';
import Calculator from './components/Calculator/Calculator';
import TextToShader from './components/TextToShader/TextToShader';
import './App.css';

const App = () => {
    const [activeTab, setActiveTab] = useState('calculator');

    return (
        <div className="app-container">
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'calculator' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calculator')}
                    >
                        Calculator
                    </button>
                    <button
                        className={`tab ${activeTab === 'textToShader' ? 'active' : ''}`}
                        onClick={() => setActiveTab('textToShader')}
                    >
                        Text To Shader
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'calculator' && <Calculator />}
                    {activeTab === 'textToShader' && <TextToShader />}
                </div>
            </div>
        </div>
    );
};

export default App;
