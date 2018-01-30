const {Client: AMQPClient, Policy} = require('amqp10')
const urlencode = require('urlencode')
const inquirer = require('inquirer')

async function connectAndHandle () {
  try {
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

      const {queue} = await inquirer.prompt(
        {
          message: 'Vilken miljö?',
          name: 'queue',
          choices: [
            {name: 'produktion', value: {name:`ug-infoclass-2/Subscriptions/canvas-prod/$DeadLetterQueue`, url:'amqps://canvas-prod'}},
            {name: 'referens', value: {name:`ug-infoclass-2/Subscriptions/canvas-ref/$DeadLetterQueue`, url:'amqps://canvas-ref'}}
          ],
          type: 'list'
        })

    const {sharedAccessKey} = await inquirer.prompt({
      message: 'Klistra in en access key till valda kön i Azure. Den finns här: https://tinyurl.com/ydfquezj',
      name: 'sharedAccessKey'
    })

    const client = await new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))
    await client.connect(`${queue.url}:${urlencode(sharedAccessKey)}@kth-integral.servicebus.windows.net`)
    const receiver = await client.createReceiver(queue.name)
    console.log('receiver created:', receiver.id)

    receiver.on('message', message => {
      console.log('new message', JSON.stringify(message, null, 4))
      if (action === 'delete') {
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
