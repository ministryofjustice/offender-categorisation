FROM node:8.11.3-slim
MAINTAINER HMPPS Digital Studio <info@digital.justice.gov.uk>
ARG BUILD_NUMBER
ARG GIT_REF

# Create app directory
RUN mkdir -p /app
WORKDIR /app
ADD . .

# Install AWS RDS Root cert
RUN curl https://s3.amazonaws.com/rds-downloads/rds-ca-2015-root.pem > /app/root.cert

RUN npm install -g npm@latest && \
    npm ci && \
    npm run build && \
    export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    npm run record-build-info

ENV PORT=3000

EXPOSE 3000
CMD [ "npm", "start" ]
