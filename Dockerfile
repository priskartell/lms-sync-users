FROM kthse/kth-nodejs-api:2.2-alpine

MAINTAINER KTH Webb "cortina.developers@kth.se"

RUN mkdir -p /npm && \
    mkdir -p /application

# We do this to avoid npm install when we're only changing code
WORKDIR /npm
COPY ["package.json", "package.json"]

RUN yarn install --production --ignore-engines --no-optional && \
    cp -a /npm/node_modules /application && \
    rm -rf /npm

WORKDIR /application

# Copy config files
COPY ["config", "config"]
COPY ["config/secretSettings.js", "config/localSettings.js"]

# Source files in root
COPY ["app.js", "app.js"]
COPY ["canvasApi.js", "canvasApi.js"]
COPY ["csvFile.js", "csvFile.js"]
COPY ["package.json", "package.json"]

# Source files directories
COPY ["server", "server"]
COPY ["messages", "messages"]
COPY ["scripts", "scripts"]

EXPOSE 3000

ENTRYPOINT ["node", "app.js"]
