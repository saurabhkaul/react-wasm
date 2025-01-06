// src/components/Calculator.tsx
import React, { useState, useEffect } from 'react';
import * as wasm from 'wasm-lib';
import './Calculator.css';

const Calculator = () => {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadWasm = async () => {
            try {
                await wasm.default();
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to initialize WASM:', err);
                setError('Failed to initialize calculator');
            }
        };

        loadWasm();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const value = await wasm.evaluate(expression);
            setResult(value);
            setError(null);
        } catch (err) {
            setError('Invalid expression');
            setResult(null);
        }
    };

    const handleClear = () => {
        setExpression('');
        setResult(null);
        setError(null);
    };

    if (isLoading) {
        return (
            <div className="calculator-container">
                <div className="loading">Loading calculator...</div>
            </div>
        );
    }

    return (
        <div className="calculator-container">
            <div className="calculator">
                <h2 className="calculator-title">Calculator</h2>

                <form onSubmit={handleSubmit} className="calculator-form">
                    <div className="input-group">
                        <input
                            type="text"
                            value={expression}
                            onChange={(e) => setExpression(e.target.value)}
                            className="expression-input"
                            placeholder="Enter expression (e.g., 2 + 2)"
                        />
                    </div>

                    <div className="button-group">
                        <button type="submit" className="button button-primary">
                            Calculate
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="button button-secondary"
                        >
                            Clear
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {result !== null && (
                    <div className="result">
                        Result: {result}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calculator;
