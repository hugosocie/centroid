var express = require( 'express' );
var app  = express();

var http = require( 'http' ).Server( app );
var io   = require( 'socket.io' )( http );

app.use( express.static( __dirname + '/dist' ) );

app.get( '/', function( req, res ){
    res.sendFile( __dirname + '/index.html' );
});

io.on( 'connection', function( socket ){
    console.log( 'a user connected' );

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on( 'update', function( msg ){
        console.log( 'message: ' + msg );
        io.emit( 'update', msg );
    })
});

http.listen( 3000, function(){
    console.log( 'listening on *:3000' );
});