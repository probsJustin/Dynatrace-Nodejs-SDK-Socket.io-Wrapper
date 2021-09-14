const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sdk = require("@dynatrace/oneagent-sdk");

const dynaio = require('./dynaio.js'); 
let inst_dynaio = new dynaio(io,sdk);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('chat message', msg => {
	dynaio.emit('chat message', msg); 
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});