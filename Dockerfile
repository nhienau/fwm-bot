FROM node:20-alpine

RUN mkdir -p /home/node/fwm-bot/node_modules && chown -R node:node /home/node/fwm-bot

WORKDIR /home/node/fwm-bot

COPY package*.json ./

RUN npm ci --unsafe-perm=true --quiet

COPY --chown=node:node . .

CMD [ "npm", "start" ]