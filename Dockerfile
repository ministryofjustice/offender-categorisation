# Stage: base image
ARG BUILD_NUMBER
ARG GIT_REF

FROM node:24-bookworm-slim AS base

LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

WORKDIR /app

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y curl

# Stage: build assets
FROM base AS build
ARG BUILD_NUMBER
ARG GIT_REF

RUN apt-get install -y make python3 wget gnupg gnupg1 gnupg2 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN CYPRESS_INSTALL_BINARY=0 npm ci --no-audit

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

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

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
