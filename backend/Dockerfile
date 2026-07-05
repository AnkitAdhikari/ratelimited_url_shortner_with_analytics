
FROM node:22-alpine AS build

RUN corepack enable
WORKDIR /repo


COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile

COPY backend/ backend/
RUN pnpm --filter @rlus/backend build


RUN pnpm --filter @rlus/backend deploy --legacy --prod /prod


FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app


COPY --chown=node:node --from=build /prod/node_modules ./node_modules
COPY --chown=node:node --from=build /repo/backend/dist ./dist
COPY --chown=node:node --from=build /repo/backend/package.json ./package.json

USER node
EXPOSE 3000

CMD ["node", "dist/server.js"]
