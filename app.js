'use strict';

var SwaggerExpress = require('swagger-express-mw');
const http=require('http');
var app = require('express')();
const path=require('path');
var express=require('express');
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

var server=http.createServer(app)
var enableCORS = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With,*');
   if ('OPTIONS' == req.method) {
      res.send(200);
  } else {
      next();
  };
};
app.use(enableCORS);





// SwaggerExpress.create(config, function(err, swaggerExpress) {
//   if (err) { throw err; }

//   // install middleware
//   swaggerExpress.register(app);

//   var port = process.env.PORT || 8080;
//   app.listen(port);
//   console.log(`App is running on port:${port}`);
 
// });
SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }
  swaggerExpress.register(app);
  var port = process.env.PORT || 8080;
  const publicPath=path.join(__dirname+'/public');
 // console.log(express.static(publicPath))
  let val=express.static(publicPath)
  app.use(val);
  server.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
  });
});
