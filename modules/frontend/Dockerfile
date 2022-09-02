FROM nginx:alpine

ENV SERVICE_VERSION $SERVICE_VERSION
ENV BUILD_NUMBER $BUILD_NUMBER

COPY ./src/assets /usr/share/nginx/html
COPY ./target/bundle.js /usr/share/nginx/html
