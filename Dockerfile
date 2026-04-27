# Use official Node.js image
FROM node:24-alpine

# Set working directory
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY frontend/ .

# Build the application
RUN npm run build

# Install serve to serve the static files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start command to serve static files
CMD ["serve", "-s", "build", "-l", "3000"]