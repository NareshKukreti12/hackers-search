
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'admin123',
    database :   'hackers_seach'
  });
  module.exports = connection;