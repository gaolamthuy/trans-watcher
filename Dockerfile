    FROM node:alpine
    WORKDIR /usr/yourapplication-name
    COPY package.json .
    RUN npm install\
        && npm install typescript -g
    COPY . .
    RUN tsc
    ENV TZ="Asia/Ho_Chi_Minh"
    CMD ["node", "./dist/index.js"]