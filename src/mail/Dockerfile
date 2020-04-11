FROM node:latest

WORKDIR /code
COPY . .

RUN yarn
RUN yarn parcel build index.js --target node

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD /wait && node dist/index.js --enable-source-maps
