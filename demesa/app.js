const net = require('net')
const http = require('http')

const serverPort = 3030
const serverHost = 'localhost'

var clientConn = reconnect()

const commands = {
  'status': getStatus
}

function reconnect () {
  console.log(`Connecting to ${serverHost}:${serverPort}...`)

  let client = new net.Socket()

  client.on('error', (err) => {
    console.error(`Socket error: `, err)
  })

  client.on('data', dataReceived)

  client.on('close', () => {
    console.log('Socket was closed!\nReconnecting in 3 secs...')
    setTimeout(() => {
      clientConn = reconnect()
    }, 3000)
  })

  client.connect(serverPort, serverHost, () => {
    console.log('Connected to server')
  })

  return client
}

function dataReceived (data) {
  console.log('Received', data.toString())
  if (commands[data.toString()] != null) {
    commands[data.toString()]()
  }
}

function getStatus () {
  console.log('Fetching status...')
  http.get('http://httpbin.org/headers', res => {
    // res.pipe(clientConn)
    res.on('data', (data) => { clientConn.write(data) })
  })
}
