# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_RAPIDAPI_KEY
ARG VITE_API_URL=/api

# Set them as environment variables for the build process
ENV VITE_RAPIDAPI_KEY=$VITE_RAPIDAPI_KEY
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
