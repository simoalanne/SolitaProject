# Install dependencies only when package.json files change
FROM node:25-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY src/backend/package*.json ./src/backend/
COPY src/frontend/package*.json ./src/frontend/
COPY src/shared/package*.json ./src/shared/
RUN npm ci
COPY src ./src

# Build frontend
FROM deps AS build
WORKDIR /app
RUN npm run build

# Create final production image that has only the necessary files
FROM node:25-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./ 
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/backend ./src/backend
COPY --from=build /app/src/shared ./src/shared
COPY --from=build /app/src/frontend/dist ./src/frontend/dist

# Remove dev dependencies that were needed for build
RUN npm prune --omit=dev

# Start the backend server which will serve the frontend as well
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=src/backend"]
