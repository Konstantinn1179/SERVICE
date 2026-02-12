# Build stage
FROM node:20-alpine

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies (Root)
# This installs dependencies for both frontend build and backend (since root package.json includes backend deps)
RUN npm install

# Copy source code
COPY . .

# Build frontend (Vite)
RUN npm run build

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
