FROM kthse/kth-nodejs-api:2.4

RUN mkdir -p /npm && \
    mkdir -p /application

# We do this to avoid npm install when we're only changing code
WORKDIR /npm
COPY ["package.json", "package.json"]

RUN npm install --production --ignore-engines --no-optional && \
    cp -a /npm/node_modules /application && \
    rm -rf /npm

WORKDIR /application
ENV NODE_PATH /application

# Copy config files
COPY ["config", "config"]

# Source files in root
COPY ["app.js", "app.js"]
COPY ["canvasApi.js", "canvasApi.js"]
COPY ["csvFile.js", "csvFile.js"]
COPY ["forkedApp.js", "forkedApp.js"]
COPY ["package.json", "package.json"]

# Source files directories
COPY ["server", "server"]
COPY ["messages", "messages"]

EXPOSE 3000

CMD ["node", "app.js"]
