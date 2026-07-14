FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create upload directory (if your app stores uploads)
RUN mkdir -p /app/uploads/kyc

EXPOSE 3001

CMD ["npm", "start"]