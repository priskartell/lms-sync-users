FROM kthse/kth-nodejs:9.11.0
RUN apk update; apk add python make;
COPY ["config", "config"]
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]

# TODO: Clean up this mess for a post-forkedApp world!
# Source files in root
COPY ["app.js", "app.js"]
COPY ["canvasApi.js", "canvasApi.js"]
COPY ["csvFile.js", "csvFile.js"]
COPY ["forkedApp.js", "forkedApp.js"]
COPY ["package.json", "package.json"]

# Source files directories
COPY ["server", "server"]
COPY ["messages", "messages"]

RUN npm install --production --ignore-engines --no-optional

EXPOSE 3000

CMD ["node", "app.js"]
