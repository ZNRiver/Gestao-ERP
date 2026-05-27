FROM oven/bun:1 AS build
WORKDIR /app
COPY frontend/package.json ./
RUN bun install
COPY frontend/ .
ARG VITE_API_URL=/api
RUN echo "VITE_API_URL=$VITE_API_URL" > .env && bun run build

FROM nginx:1.27-alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
