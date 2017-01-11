FROM kthse/kth-nodejs-api:2.0-alpine

MAINTAINER KTH Webb "cortina.developers@kth.se"

RUN mkdir -p /npm && \
    mkdir -p /application && \
    apk add  --no-cache alpine-sdk gcc make && \
    node --version




# We do this to avoid npm install when we're only changing code
WORKDIR /npm
COPY ["package.json", "package.json"]
RUN npm install --production --no-optional --loglevel verbose

# Add the code and copy over the node_modules-catalog
WORKDIR /application
RUN cp -a /npm/node_modules /application && \
    rm -rf /npm

# Copy config files
COPY ["config", "config"]
COPY ["config/secretSettings.js", "config/localSettings.js"]

# Source files in root
COPY ["app.js", "app.js"]
COPY ["azureStorage.js", "azureStorage.js"]
COPY ["azureTest.js", "azureTest.js"]
COPY ["canvasApi.js", "canvasApi.js"]
COPY ["csvFile.js", "csvFile.js"]

# Source files directories
COPY ["azure", "azure"]
COPY ["server", "server"]
COPY ["messages", "messages"]
COPY ["scripts", "scripts"]

ENV NODE_PATH /application

EXPOSE 3000

ENTRYPOINT ["node", "app.js"]
