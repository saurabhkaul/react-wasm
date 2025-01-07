import React, { useState, useEffect, useRef } from 'react';
//ignoring since this lib doesnt have types
// @ts-ignore
import GlslCanvas from 'glslCanvas';
import './TextToShader.css';
import {defaultShader, WEB_GL_API_HOST} from "./constants";




const TextToShader = () => {
    const [prompt, setPrompt] = useState('');
    const [shaderCode, setShaderCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sandboxRef = useRef<GlslCanvas | null>(null);



    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize GlslCanvas
        const sandbox = new GlslCanvas(canvasRef.current);
        sandboxRef.current = sandbox;

        // Set initial shader
        sandbox.load(defaultShader);
        setShaderCode(defaultShader);

        // Clean up
        return () => {
            if (sandboxRef.current) {
                sandboxRef.current.destroy();
            }
        };
    },[]);

    const handleGenerateShader = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${WEB_GL_API_HOST}/api/generate-shader`, {
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
            const code = data.shader_code[0].text;

            // Add precision qualifier if it's missing
            const finalCode = code.includes('precision')
                ? code
                : `#ifdef GL_ES\nprecision mediump float;\n#endif\n\n${code}`;

            try {
                // Try to load the new shader
                if (sandboxRef.current) {
                    sandboxRef.current.load(finalCode);
                    setShaderCode(finalCode);
                    setError('');
                }
            } catch (shaderError) {
                console.error('Shader compilation error:', shaderError);
                setError('Failed to compile shader');
                // Revert to default shader
                if (sandboxRef.current) {
                    sandboxRef.current.load(defaultShader);
                }
            }
        } catch (err) {
            setError('Failed to generate shader');
            console.error('Shader generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-to-shader">
            <div className="shader-input">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the shader you want (e.g., 'A colorful gradient that changes with time')"
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
                    />
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

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
