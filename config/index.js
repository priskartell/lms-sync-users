// Read .env file
require('dotenv').config()

// Read localSettings.js, a dirty fix for making the ansible script deploy as before
require('dotenv').config({path: './config/localSettings.js'})

module.exports = {
  dontRun: process.env.DONT_RUN || false,
  proxyPrefixPath: {
    uri: '/lms-sync'
  },
  port: 3000,
  canvas: {
    apiUrl: process.env.CANVAS_API_URL || 'https://kth.test.instructure.com/api/v1'
  },
  logging: {
    log: {
      level: process.env.LOG_LEVEL || 'info',
      src: process.env.LOG_SRC || false
    }
  },
  azure: {
    queueName: process.env.AZURE_QUEUE_NAME,
    host: process.env.AZURE_HOST || 'lms-queue.servicebus.windows.net',
    SharedAccessKeyName: process.env.AZURE_SHARED_ACCESS_KEY_NAME || 'RootManageSharedAccessKey',
    SharedAccessKey: process.env.AZURE_SHARED_ACCESS_KEY
  },
  localFile: {
    csvDir: process.env.SERVER_PORT || '/tmp/'
  }
}
