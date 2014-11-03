
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , parse = require('csv-parse');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var list = [];
var users = [];
app.get('/', function(req, res) {
	res.render('table', {
        list: list,
		users: users,
		userid: '3',
		username: 'Henry Sullivan'
    });
});

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
    
	fs.readFile(__dirname+'/sampledata.csv', 'binary', function(err, data) {
        //console.log(err, data);
        parse(data, {delimiter: ','}, function(err, output){
            for(var i=1; i<output.length; i++) {
                var json = {};
                for(var j=0; j<output[i].length; j++) {
                    json[output[0][j]] = output[i][j];
                }
                list.push(json);
            }
	   });
    });
	
	fs.readFile(__dirname+'/usersworkstream.csv', 'binary', function(err, data) {
        //console.log(err, data);
        parse(data, {delimiter: ','}, function(err, output){
            for(var i=1; i<output.length; i++) {
                var json = {};
                for(var j=0; j<output[i].length; j++) {
                    json[output[0][j]] = output[i][j];
                }
                users.push(json);
            }
	   });
    });
});