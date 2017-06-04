const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')

let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
      welcome(session)
      break
  }
}

function onMessage(session, message) {
  if (isNaN(message.body)) {
    welcome(session)
  } else {
    if (session.get('answer') != '' && message.body == session.get('answer')) {
      AnswerR(session)
    }else if (session.get('answer') != '' && message.body != session.get('answer')) {
      AnswerW(session)
    }else {
      welcome(session)
    }
  }
}

function onCommand(session, command) {
  switch (command.content.value) {
    case 'no':
      no(session)
      break
    case 'count':
      count(session)
      break
    case '1digitadds':
      session.set('problems', '1digitadds')
      puzzle(session)
      break
    case '2digitadds':
      session.set('problems', '2digitadds')
      puzzle(session)
      break
    case '1digitsubs':
      session.set('problems', '1digitsubs')
      puzzle(session)
      break
    case '2digitsubs':
      session.set('problems', '2digitsubs')
      puzzle(session)
      break
    case 'donate':
      donate(session)
      break
    case 'seeanswer':
      seeanswer(session)
      break
    }
}

function onPayment(session, message) {
  if (message.fromAddress == session.config.paymentAddress) {
    // handle payments sent by the bot
    if (message.status == 'confirmed') {
      // perform special action once the payment has been confirmed
      // on the network
    } else if (message.status == 'error') {
      // oops, something went wrong with a payment we tried to send!
    }
  } else {
    // handle payments sent to the bot
    if (message.status == 'unconfirmed') {
      // payment has been sent to the ethereum network, but is not yet confirmed
      sendMessage(session, `Thanks for the payment! 🙏`);
    } else if (message.status == 'confirmed') {
      // handle when the payment is actually confirmed!
    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment!🚫`);
    }
  }
}

// STATES

function welcome(session) {
  sendMessage(session, `Do you want to solve math problems? (Enter 'X' to change/stop.)`)
}

function no(session) {
  session.set('answer', '')
  sendMessageDonate(session, `Bye. See you again.`)
}

function puzzle(session) {
  switch (session.get('problems')) {
    case '1digitadds':
      n1 = Math.floor(Math.random().toFixed(2)*10)
      n2 = Math.floor(Math.random().toFixed(2)*10)
      an = n1 + n2
      messageP = n1.toString() + ' + ' + n2.toString()
      break
    case '2digitadds':
      n1 = Math.floor(Math.random().toFixed(2)*100)
      n2 = Math.floor(Math.random().toFixed(2)*100)
      an = n1 + n2
      messageP = n1.toString() + ' + ' + n2.toString()
      break
    case '1digitsubs':
      n1 = Math.floor(Math.random().toFixed(2)*10)
      n2 = Math.floor(Math.random().toFixed(2)*10)
      if (n1 > n2){
        an = n1 - n2
        messageP = n1.toString() + ' - ' + n2.toString()
      }else{
        an = n2 - n1
        messageP = n2.toString() + ' - ' + n1.toString()
      }
      break
    case '2digitsubs':
      n1 = Math.floor(Math.random().toFixed(2)*100)
      n2 = Math.floor(Math.random().toFixed(2)*100)
      if (n1 > n2){
        an = n1 - n2
        messageP = n1.toString() + ' - ' + n2.toString()
      }else{
        an = n2 - n1
        messageP = n2.toString() + ' - ' + n1.toString()
      }
      break
    }
  session.set('answer', an.toString())
  sendMessageSimple(session, messageP + ' = ?')
}

function AnswerR(session){
  sendMessageSimple(session, `Correct.`)
  puzzle(session)
}

function AnswerW(session){
  sendMessageAnswerW(session, `Please try again. Or ..`)
}

// example of how to store state on each user
function count(session) {
  let count = (session.get('count') || 0) + 1
  session.set('count', count)
  sendMessage(session, `${count}`)
}

function donate(session) {
  // request $1 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.requestEth(toEth.USD(1))
  })
}

function seeanswer(session){
  sendMessageSimple(session, 'Correct answer is: ' + session.get('answer'))
  puzzle(session)
}

// HELPERS

function sendMessage(session, message) {
  let controls = [
    {type: 'button', label: '1-digit additions', value: '1digitadds'},
    {type: 'button', label: '2-digit additions', value: '2digitadds'},
    {type: 'button', label: '1-digit subtractions', value: '1digitsubs'},
    {type: 'button', label: '2-digit subtractions', value: '2digitsubs'},
    {type: 'button', label: 'No', value: 'no'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false
  }))
}

function sendMessageDonate(session, message) {
  let controls = [
    {type: 'button', label: 'Please Donate', value: 'donate'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false
  }))
}

function sendMessageSimple(session, message) {
  session.reply(SOFA.Message({
    body: message,
    showKeyboard: true
  }))
}

function sendMessageAnswerW(session, message) {
  let controls = [
    {type: 'button', label: 'See Answer', value: 'seeanswer'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false
  }))
}
