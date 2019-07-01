'use strict'
var mysql = require('mysql');
require('dotenv').config();

// HOST='50.62.209.3'
// USERNAME='hackers_search'
// PASSWORD='0Tx5r3$d'
// DATABASE='hackers_search'
// CONNECTIONLIMIT=5


// HOST='localhost'
// USERNAME='root'
// PASSWORD='admin123$d'
// DATABASE='hackers_search'
// CONNECTIONLIMIT=5

  var db_config = {
     host     : process.env.HOST,//'50.62.209.3',
    user     : process.env.USERNAME,
    password : process.env.PASSWORD,
    database : process.env.DATABASE,
    connectionLimit: process.env.CONNECTIONLIMIT,
  };
  var connection = mysql.createPool(
    db_config
  );
  
  

  // Attempt to catch disconnects 
  connection.on('connection', function (connection) {
    console.log('DB Connection established');
  
    connection.on('error', function (err) {
      console.error(new Date(), 'MySQL error', err.code);
    });
    connection.on('close', function (err) {
      console.error(new Date(), 'MySQL close', err);
    });
  
  });
  

  module.exports = connection;