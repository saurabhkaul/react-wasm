export const WEB_GL_API_HOST = process.env.REACT_APP_API ? process.env.REACT_APP_API : "http://localhost:4000";


// Default shader with basic animation
export const defaultShader = `
        #ifdef GL_ES
        precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;

        void main() {
            vec2 uv = gl_FragCoord.xy/u_resolution.xy;
            gl_FragColor = vec4(uv.x, uv.y, 0.5 + 0.5 * sin(u_time), 1.0);
        }
    `;
