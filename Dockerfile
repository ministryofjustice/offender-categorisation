# Build args available to all stages
ARG BUILD_NUMBER
ARG GIT_REF
ARG GIT_BRANCH

# Stage: build assets
FROM ghcr.io/ministryofjustice/hmpps-node:24-alpine AS build

ARG BUILD_NUMBER
ARG GIT_REF
ARG GIT_BRANCH

# Cache breaking and ensure required build / git args defined
RUN test -n "$BUILD_NUMBER" || (echo "BUILD_NUMBER not set" && false)
RUN test -n "$GIT_REF" || (echo "GIT_REF not set" && false)
RUN test -n "$GIT_BRANCH" || (echo "GIT_BRANCH not set" && false)

WORKDIR /app

RUN npm install -g npm@12.0.2

RUN apk add --no-cache \
    make \
    python3 \
    wget \
    gnupg

COPY package*.json ./

RUN NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    CYPRESS_INSTALL_BINARY=0 \
    npm run setup

ENV NODE_ENV=production

COPY . .

RUN npm run build

ENV BUILD_NUMBER=${BUILD_NUMBER:-1_0_0}
ENV GIT_REF=${GIT_REF:-dummy}

RUN npm run record-build-info

RUN npm prune --no-audit --no-fund --omit=dev

# Stage: copy production assets and dependencies
FROM ghcr.io/ministryofjustice/hmpps-node:24-alpine-runtime

ARG BUILD_NUMBER
ARG GIT_REF
ARG GIT_BRANCH

# Install AWS RDS Root cert
RUN mkdir -p /home/appuser/.postgresql \
    && wget -qO /app/root.cert \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

COPY --from=build --chown=appuser:appgroup \
    /app/package.json \
    /app/package-lock.json \
    /app/log.js \
    ./

COPY --from=build --chown=appuser:appgroup \
    /app/build-info.json ./dist/build-info.json

COPY --from=build --chown=appuser:appgroup \
    /app/assets ./assets

COPY --from=build --chown=appuser:appgroup \
    /app/dist ./dist

COPY --from=build --chown=appuser:appgroup \
    /app/node_modules ./node_modules

COPY --from=build --chown=appuser:appgroup \
    /app/migrations ./migrations

COPY --from=build --chown=appuser:appgroup \
    /app/package.json ./dist/package.json

EXPOSE 3000
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV GIT_REF=${GIT_REF}
ENV GIT_BRANCH=${GIT_BRANCH}
ENV NODE_ENV=production
USER 2000

CMD [ "node", "dist/server.js" ]
