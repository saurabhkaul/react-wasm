# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=23.5.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"



# Stage 1: Build Rust WASM
FROM rust:1.83 as wasm-builder

# Install wasm-pack
#RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory for Rust WASM
WORKDIR /usr/src/wasm-lib

# Copy Rust project files
COPY wasm-lib/Cargo.toml wasm-lib/Cargo.lock ./
COPY wasm-lib/src ./src

RUN cargo install wasm-pack

RUN wasm-pack build --target web --out-dir pkg



# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

#COPY --from=wasm-builder /usr/src/wasm-lib/pkg ./src/wasm-lib


COPY --from=wasm-builder /usr/src/wasm-lib/pkg ./src/wasm-lib/pkg

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
