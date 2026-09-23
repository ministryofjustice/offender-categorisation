# Stage: base image
ARG BUILD_NUMBER
ARG GIT_REF

FROM ghcr.io/ministryofjustice/hmpps-node:24-alpine AS base

LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

RUN apk --update-cache upgrade --available \
        && apk --no-cache add tzdata \
        && rm -rf /var/cache/apk/* \
        && apk add --no-cache curl

WORKDIR /app


# Stage: build assets
FROM base AS build
ARG BUILD_NUMBER
ARG GIT_REF

RUN apk add --no-cache make python3 wget gnupg \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json .allowed-scripts.mjs ./
RUN NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false CYPRESS_INSTALL_BINARY=0 npm run setup
ENV NODE_ENV='production'

COPY . .
RUN npm run build

ENV BUILD_NUMBER=${BUILD_NUMBER:-1_0_0}
ENV GIT_REF=${GIT_REF:-dummy}
RUN export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    npm run record-build-info

RUN npm prune --no-audit --production

# Stage: copy production assets and dependencies
FROM base

ARG BUILD_NUMBER
ARG GIT_REF
ENV BUILD_NUMBER=${BUILD_NUMBER:-1_0_0}
ENV GIT_REF=${GIT_REF:-dummy}

RUN apk update \
 && apk upgrade \
 && rm -rf /var/cache/apk/

# Install AWS RDS Root cert
RUN mkdir -p /home/appuser/.postgresql \
    && curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    > /app/root.cert

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
ENV NODE_ENV='production'
USER 2000

CMD [ "npm", "start" ]
