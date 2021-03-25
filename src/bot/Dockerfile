FROM node:14

WORKDIR /code
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

COPY package.json .

RUN yarn

COPY . .
RUN yarn parcel build index.ts --target node

CMD /wait && node dist/index.js --enable-source-maps
