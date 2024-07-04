FROM node:20.12-bookworm-slim
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"
ARG BUILD_NUMBER
ARG GIT_REF

RUN apt-get update && \
  apt-get upgrade -y && \
  apt-get install -y curl && \
  apt-get autoremove -y && \
  rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

RUN addgroup --gid 2000 --system appgroup && \
  adduser --uid 2000 --system appuser --gid 2000

# Create app directory
RUN mkdir -p /app
WORKDIR /app
ADD . .

# Install AWS RDS Root cert
RUN curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem > /app/root.cert

ENV BUILD_NUMBER ${BUILD_NUMBER:-1_0_0}
ENV GIT_REF ${GIT_REF:-dummy}
RUN npm ci --no-audit && \
  npm run build && \
  export BUILD_NUMBER=${BUILD_NUMBER} && \
  export GIT_REF=${GIT_REF} && \
  npm run record-build-info

RUN npm prune --no-audit --production
RUN rm -rf /root/.cache

ENV PORT=3000
ENV NODE_ENV='production'
EXPOSE 3000

RUN chown -R appuser:appgroup /app

USER 2000

CMD [ "npm", "start" ]
