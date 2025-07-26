FROM node:20-slim

# Create the directory!
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copy and Install our bot
COPY package.json /usr/src/bot
RUN npm install

# Our precious bot
COPY . /usr/src/bot

#Register Commands
CMD ["node", "util.js"]

# Start me!
CMD ["node", "app.js"]