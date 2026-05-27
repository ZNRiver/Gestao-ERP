FROM oven/bun:1 AS build
WORKDIR /app
COPY backend/package.json ./
RUN bun install
COPY backend/ .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["bun", "dist/server.js"]
