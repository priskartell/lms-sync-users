const config = require('../config/prodSettings')
const {Client: AMQPClient, Policy} = require('amqp10')
const urlencode = require('urlencode')
const inquirer = require('inquirer')

async function connectAndHandle () {
  try {
    const queueName = `${config.azure.queueName}/$DeadLetterQueue`

    const {action} = await inquirer.prompt(
      {
        message: 'Vad vill du göra?',
        name: 'action',
        choices: [
          {name: 'Bara läsa meddelanden', value: 'read'},
          {name: 'Läsa meddelanden och rensa kön', value: 'delete'}
        ],
        type: 'list'
      })

    const {sharedAccessKey} = await inquirer.prompt({
      message: 'Klistra in en access key till kön canvas-prod i Azure. Den finns här: https://tinyurl.com/ydfquezj',
      name: 'sharedAccessKey'
    })

    if (action === 'delete') {
      const {confirmed} = await inquirer.prompt({
        message: 'Vill du verkligen ta bort meddelandena?',
        name: 'confirmed',
        type: 'confirm',
        default: false
      })
    }

    const client = await new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))
    await client.connect(`amqps://${config.azure.SharedAccessKeyName}:${urlencode(sharedAccessKey)}@${config.azure.host}`)
    const receiver = await client.createReceiver(queueName)
    console.log('receiver created:', receiver.id)

    receiver.on('message', message => {
      console.log('new message', JSON.stringify(message, null, 4))
      if (action === 'delete' && confirmed) {
        receiver.accept(message)
      } else {
        receiver.release(message)
      }
    })
  } catch (e) {
    console.error('error:', e)
  }
}

connectAndHandle()
