'use strict'
var mysql = require('mysql');
// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'root',
//     password : 'admin123',
//     database :   'hackers_seach'
//   });
  // var connection = mysql.createConnection({
  //   host     : '50.62.209.3',
  //   user     : 'hackers_search',
  //   password : '0Tx5r3$d',
  //   database : 'hackers_search'
  // });
//   var db_config = {
//     host     : 'localhost',
//     user     : 'root',
//     password : 'admin123',
//     database :   'hackers_seach',
//     connectionLimit: 5,
//  };

  var db_config = {
     host     : '50.62.209.3',
    user     : 'hackers_search',
    password : '0Tx5r3$d',
    database : 'hackers_search',
    connectionLimit: 5,
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