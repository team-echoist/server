FROM node:20.12.0
LABEL authors="daechanjo"

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install

RUN npm run build

EXPOSE 3000

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
