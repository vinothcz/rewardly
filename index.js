var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');

var portNumber = process.env.PORT || 4200;

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/public/index.html');
});

server.listen(portNumber);

io.on('connection', function (client) {
    console.log('Client connected...');

    client.on('join', function (data) {
        console.log(data);
        client.emit('messages', 'Hello from server');
    });

    client.on('messages', function (data) {
        client.emit('broad', data);
        client.broadcast.emit('broad', data);
    });

});