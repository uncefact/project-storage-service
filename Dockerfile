FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# The local storage adapter writes under /app/src/uploads (LOCAL_DIRECTORY,
# default "uploads"). Creating it owned by the runtime user means a fresh named
# volume mounted there inherits that ownership. A volume or host directory
# created by an earlier root-run image stays root-owned and must be chowned to
# uid 1000 once.
RUN mkdir -p /app/src/uploads && chown node:node /app/src/uploads

USER node

# Shell form so PORT, which is runtime configuration, expands when the check runs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${PORT:-3333}/health-check" || exit 1

# Same command as the start script, run directly so node is PID 1 and receives SIGTERM.
CMD [ "node", "dist/index.js" ]
