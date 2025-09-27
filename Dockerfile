# Multi-stage Dockerfile for GreenQuote Application
# Builds both server and client in a single container

# Stage 1: Build the React client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source code
COPY client/ ./

# Build the client
RUN npm run build

# Stage 2: Build the Node.js server
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies (including dev dependencies for build)
RUN npm ci

# Copy server source code
COPY server/ ./

# Build the server
RUN npm run build

# Stage 3: Production image with nginx
FROM nginx:alpine AS production

# Install Node.js and dumb-init
RUN apk add --no-cache nodejs npm dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built server from server-builder stage
COPY --from=server-builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=server-builder --chown=nodejs:nodejs /app/server/package*.json ./server/
COPY --from=server-builder --chown=nodejs:nodejs /app/server/migrations ./server/migrations
COPY --from=server-builder --chown=nodejs:nodejs /app/server/scripts ./server/scripts

# Copy built client from client-builder stage
COPY --from=client-builder /app/client/dist /usr/share/nginx/html

# Install only production dependencies for server
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# Create nginx configuration for client
RUN echo 'server {\n\
    listen 5000;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # Handle client-side routing\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # API proxy to backend\n\
    location /api/ {\n\
        proxy_pass http://localhost:3000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_cache_bypass $http_upgrade;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Create logs directory
RUN mkdir -p /app/server/logs && chown -R nodejs:nodejs /app/server/logs

# Create startup script
RUN echo '#!/bin/sh\n\
# Start nginx for client\n\
nginx -g "daemon off;" &\n\
NGINX_PID=$!\n\
\n\
# Start the server\n\
cd /app/server && npm start &\n\
SERVER_PID=$!\n\
\n\
# Wait for both processes\n\
wait $SERVER_PID $NGINX_PID' > /app/start.sh && \
chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start both server and client
CMD ["/app/start.sh"]
