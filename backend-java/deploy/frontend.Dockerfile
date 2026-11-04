FROM node:20-alpine AS build
WORKDIR /src
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ .
# Empty value => the app calls the relative path /api on the same origin (served by nginx below)
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

FROM nginx:1.27-alpine
COPY backend-java/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/build /usr/share/nginx/html
EXPOSE 80
