const express = require('express')
const net = require('net')
const _ = require('lodash')
const app = express()

var clientSockets = {}

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/clients', (req, res) => {
  res.json(_.keyBy(_.map(clientSockets, (el, idx) => {
    return {addr: el.remoteAddress, port: el.remotePort}
  }), (el) => { return el.port }))
})

app.get('/status/:id', (req, res) => {
  const id = parseInt(req.params['id'])
  if (clientSockets[id] == null) {
    res.status(404).send('No such client')
    return
  }

  const closed = () => { res.status(503).send('Remote client closed connection!') }
  const errored = (err) => { res.status(500).send(`Remote client connection error: ${err}`) }

  clientSockets[id].write('status')
  clientSockets[id].once('data', (buffer) => {
    console.log(`got data from client (${clientSockets[id].remoteAddress}): ${buffer.length} bytes`)
    res.status(200).type('text').send(buffer)

    clientSockets[id].removeListener('close', closed)
    clientSockets[id].removeListener('error', errored)
  })

  clientSockets[id].once('close', closed)
  clientSockets[id].once('error', errored)
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))

// NET SOCKET I/O

const sockServ = net.createServer((clientSock) => {
  console.log(`Client Socket connected (remote: ${clientSock.remoteAddress} ${clientSock.remotePort})`)
  clientSockets[clientSock.remotePort] = clientSock

  clientSock.on('close', () => {
    delete clientSockets[clientSock.remotePort]
    console.log(`Closed socket (remote: ${clientSock.remoteAddress})`)
  })
})

sockServ.listen(3030)
console.log(`TCP socket listening on ${sockServ.address().port}...`)
