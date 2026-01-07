# Use an official Node.js runtime as a parent image (choose a Long Term Support version)
FROM node:18-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache.
COPY package*.json ./

# Install production dependencies using npm ci for faster, more reliable builds.
RUN npm ci --omit=dev

# Bundle app source code.
COPY . .

# Expose the port the app runs on.
EXPOSE 8080

# Create a non-root user and switch to it.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
USER appuser

# The CMD instruction starts your server.
CMD [ "npm", "start" ]
