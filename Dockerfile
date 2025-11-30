# build react


FROM node:20-alpine AS frontend_builder

ARG REACT_API_URL=http://localhost

WORKDIR /app/frontend

COPY ClipperApp/package*.json ./
COPY ClipperApp/ ./

RUN npm install

ENV REACT_APP_API_URL=${REACT_API_URL}

RUN npm run build


# build server

FROM node:20-alpine AS backend_builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production


# start

FROM node:20-alpine

WORKDIR /app

RUN chown -R node:node /app

COPY --from=frontend_builder /app/frontend/build ./build

COPY --from=backend_builder /app/node_modules ./node_modules

COPY server.js .
COPY src ./src
COPY package.json .

EXPOSE 12000

USER node

CMD ["npm", "start"]