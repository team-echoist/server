FROM node:21.7.1
LABEL authors="daechanjo"

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start:prod"]
