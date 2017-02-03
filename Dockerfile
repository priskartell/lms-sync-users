FROM kthse/kth-nodejs-api:2.2-alpine

MAINTAINER KTH Webb "cortina.developers@kth.se"

RUN mkdir -p /npm && \
    mkdir -p /application

# We do this to avoid npm install when we're only changing code
WORKDIR /npm
COPY ["package.json", "package.json"]

RUN yarn install --production --ignore-engines --no-optional

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
COPY ["package.json", "package.json"]

# Source files directories
COPY ["azure", "azure"]
COPY ["server", "server"]
COPY ["messages", "messages"]
COPY ["scripts", "scripts"]

ENV NODE_ENV development
EXPOSE 3001

ENTRYPOINT ["node", "app.js"]
