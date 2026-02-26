# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./
RUN npm ci

# Copy the rest of the application (ignoring local node_modules via .dockerignore)
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy built files from the 'build' stage
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

