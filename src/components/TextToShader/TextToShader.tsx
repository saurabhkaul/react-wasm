import React, { useState, useEffect, useRef } from 'react';
import './TextToShader.css';

const WEB_GL_API = process.env.NODE_ENV === "production" ? "https://webgl-api.fly.dev" : "http://localhost:4000";


const TextToShader = () => {
    const [prompt, setPrompt] = useState('');
    const [shaderCode, setShaderCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Handle shader generation
    const handleGenerateShader = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${WEB_GL_API}/api/generate-shader`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error('Failed to generate shader');
            }

            const data = await response.json();
            let shaderCode = data.shader_code[0].text;
            setShaderCode(shaderCode);
            initShader(shaderCode);
        } catch (err) {
            setError('Failed to generate shader');
            console.error('Shader generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };


    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) {
            setError('Failed to create shader');
            return null;
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            setError(`Shader compilation error: ${info}`);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    };

    const initShader = (fragmentShaderSource: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            setError('WebGL not supported');
            return;
        }

        // Clear any previous errors
        setError('');

        // Vertex shader source
        const vertexShaderSource = `
            attribute vec4 position;
            void main() {
                gl_Position = position;
            }`;

        // Create shaders
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) {
            return; // Error already set by createShader
        }

        // Create program
        const program = gl.createProgram();
        if (!program) {
            setError('Failed to create shader program');
            return;
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Check if linking succeeded
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            setError(`Program link error: ${info}`);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return;
        }

        gl.useProgram(program);

        // Create buffer for full-screen quad
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,
                1, -1,
                -1,  1,
                1,  1
            ]),
            gl.STATIC_DRAW
        );

        // Set up attribute
        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Clear canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Cleanup
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    };

    return (
        <div className="text-to-shader">
            <div className="shader-input">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the shader you want (e.g., 'A rotating cube with a gradient background')"
                    className="shader-prompt"
                />
                <button
                    onClick={handleGenerateShader}
                    disabled={isLoading || !prompt.trim()}
                    className="generate-button"
                >
                    {isLoading ? 'Generating...' : 'Generate Shader'}
                </button>
            </div>

            <div className="shader-output">
                <div className="canvas-container">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="shader-canvas"
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                {shaderCode && (
                    <div className="code-container">
                        <h3>Generated Shader Code:</h3>
                        <pre className="shader-code">{shaderCode}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextToShader;
