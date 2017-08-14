const config = require('../config/prodSettings')
const sharedAccessKey = process.env['SHARED_ACCESS_KEY']
console.log('shared access key:', sharedAccessKey)
const {Client: AMQPClient, Policy} = require('amqp10')
const client = new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))
const urlencode = require('urlencode')

// const queueName = `ug-infoclass-2/$DeadLetterQueue`
const queueName = `${config.azure.queueName}/$DeadLetterQueue`

client.connect(`amqps://${config.azure.SharedAccessKeyName}:${urlencode(sharedAccessKey)}@${config.azure.host}`)
.then(() => client.createReceiver(queueName))
.then(receiver => {
  console.log('receiver created:', receiver.id)

  receiver.on('message', message => {
    console.log('new message', JSON.stringify(message, null, 4))
    receiver.release(message)
  })
})
