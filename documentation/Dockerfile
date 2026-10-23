# Setup the environment
FROM node:22-alpine

WORKDIR /app

# Set the environment variables
ENV PORT=3002 \
    DOCS_URL=http://0.0.0.0 \
    DOCS_BASE_URL=/

# The development server writes .docusaurus and node_modules/.cache under /app,
# so the runtime user owns /app and installs the dependencies itself.
RUN chown node:node /app

USER node

# Install the dependencies
COPY --chown=node:node package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Copy the documentation site files
COPY --chown=node:node . .

# Expose the port the documentation site will run on
EXPOSE ${PORT}

# The development server compiles the site before it answers, so the start
# period allows for a cold build.
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${PORT}${DOCS_BASE_URL}" || exit 1

# Start the documentation site
CMD yarn start --port $PORT --host 0.0.0.0


