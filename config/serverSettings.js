module.exports = {
  port: 3000,
  canvas: {
    apiUrl: getEnv('CANVAS_API_URL', 'https://kth.test.instructure.com/api/v1')
  },
  logging: {
    log: {
      level: getEnv('LOG_LEVEL', 'info'),
      src: getEnv('LOG_SRC', false)
    }
  },
  azure: {
    queueName: getEnv('AZURE_QUEUE_NAME', 3001),
    host: getEnv('AZURE_HOST', 'lms-queue.servicebus.windows.net'),
    SharedAccessKeyName: getEnv('AZURE_SHARED_ACCESS_KEY_NAME', 'RootManageSharedAccessKey'),
    SharedAccessKey: getEnv('AZURE_SHARED_ACCESS_KEY')
  },
  localFile: {
    csvDir: getEnv('SERVER_PORT', '/tmp/')
  }
}
