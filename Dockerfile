    FROM node:alpine
    ENV TZ="Asia/Ho_Chi_Minh"
    WORKDIR /usr/yourapplication-name
    COPY package.json .
    RUN npm install\
        && npm install typescript -g
    COPY . .
    RUN tsc
    CMD ["node", "./dist/index.js"]