FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY services/api ./services/api
CMD ["node", "services/api/src/index.js"]
