// src/components/TextToShader/__tests__/TextToShader.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextToShader from '../TextToShader';

// Mock GlslCanvas
// jest.mock('glslCanvas', () => {
//     return {
//         default: jest.fn().mockImplementation(() => ({
//             load: jest.fn(),
//             destroy: jest.fn()
//         }))
//     };
// });

jest.mock('glslCanvas')

// Mock fetch
global.fetch = jest.fn();

describe('TextToShader', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });


    it('shows error when API fails', async () => {
        // Mock failed API response
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.reject(new Error('API Error'))
        );

        render(<TextToShader />);

        // Type in input and click button
        const input = screen.getByPlaceholderText(/Describe the shader/i);
        fireEvent.change(input, { target: { value: 'A red circle' } });

        const button = screen.getByRole('button', { name: /Generate Shader/i });
        fireEvent.click(button);

        // Check error message
        await waitFor(() => {
            expect(screen.getByText(/Failed to generate shader/i)).toBeInTheDocument();
        });
    });

    it('displays shader code when API succeeds', async () => {
        const testShaderCode = 'test shader code';

        // Mock successful API response
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    shader_code: [{ text: testShaderCode }]
                })
            })
        );

        render(<TextToShader />);

        // Type in input and click button
        const input = screen.getByPlaceholderText(/describe the shader/i);
        fireEvent.change(input, { target: { value: 'test shader' } });

        const button = screen.getByRole('button', { name: /generate/i });
        fireEvent.click(button);

        // Check if shader code is displayed
        await waitFor(() => {
            expect(screen.getByText(/test shader code/i)).toBeInTheDocument();
        });
    });
});