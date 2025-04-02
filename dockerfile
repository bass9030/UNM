FROM node:20

WORKDIR /usr/src/unm

COPY ./package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "./bin/www"]