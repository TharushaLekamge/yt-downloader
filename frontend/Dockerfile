# Use official Node.js image
FROM node:20-slim

# Set workdir
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the frontend code
COPY . .

# Build the frontend (for production)
RUN npm run build

# Expose frontend port (default for Next.js)
EXPOSE 3000

# Start frontend (use 'start' for production, 'dev' for development)
CMD ["npm", "run", "start"]