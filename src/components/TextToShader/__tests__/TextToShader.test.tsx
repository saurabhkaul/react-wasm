import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextToShader from '../TextToShader';
import { WEB_GL_API_HOST } from '../constants';

// Mock GlslCanvas
jest.mock('glslCanvas', () => {
    return jest.fn().mockImplementation(() => ({
        load: jest.fn(),
        destroy: jest.fn(),
    }));
});

describe('TextToShader', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Mock fetch
        global.fetch = jest.fn();
    });



    it('shows loading state when generating shader', async () => {
        // Mock successful API response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                shader_code: [{ text: 'void main() { gl_FragColor = vec4(1.0); }' }]
            })
        });

        render(<TextToShader />);

        // Enter text and click generate
        const input = screen.getByPlaceholderText(/Describe the shader/i);
        await userEvent.type(input, 'test shader');

        const button = screen.getByRole('button', { name: /generate/i });
        await userEvent.click(button);

        // Check loading state
        expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    it('displays error message on API failure', async () => {
        // Mock failed API response
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

        render(<TextToShader />);

        // Enter text and click generate
        const input = screen.getByPlaceholderText(/Describe the shader/i);
        await userEvent.type(input, 'test shader');

        const button = screen.getByRole('button', { name: /generate/i });
        await userEvent.click(button);

        // Check error message
        await waitFor(() => {
            expect(screen.getByText(/failed to generate shader/i)).toBeInTheDocument();
        });
    });


    it('displays generated shader code', async () => {
        const shaderCode = 'void main() { gl_FragColor = vec4(1.0); }';

        // Mock successful API response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                shader_code: [{ text: shaderCode }]
            })
        });

        render(<TextToShader />);

        // Enter text and click generate
        const input = screen.getByPlaceholderText(/Describe the shader/i);
        await userEvent.type(input, 'test shader');

        const button = screen.getByRole('button', { name: /generate/i });
        await userEvent.click(button);

        // Check if shader code is displayed
        await waitFor(() => {
            expect(screen.getByText(shaderCode)).toBeInTheDocument();
        });
    });
});
