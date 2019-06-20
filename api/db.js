
var mysql = require('mysql');
// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'root',
//     password : 'admin123',
//     database :   'hackers_seach'
//   });
  var connection = mysql.createConnection({
    host     : '50.62.209.3',
    user     : 'hackers_search',
    password : '0Tx5r3$d',
    database : 'hackers_search'
  });
  module.exports = connection;