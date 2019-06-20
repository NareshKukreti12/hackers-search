'use strict'
var connection = require('./db');

class Users{
 static GetUserByEmail(email){
    return new Promise((resolve,reject)=>{

      let query='select UA.*,x.permissions from user_account UA ' +
      'LEFT JOIN  (SELECT s.role_id,'+
      'GROUP_CONCAT(s.permission_id) AS permissions  '+
      'FROM user_permissions s '+
      'GROUP BY s.role_id) x ON x.role_id = UA.role_id '+
      'where UA.email=? and status=?'

        connection.query(query,[email,1],function(err,result){
           if(err)reject(err);
           resolve(result)
        })
    })
 }
 static GetUserByUserId(user_id){
   return new Promise((resolve,reject)=>{
      let query='select UA.*,x.permissions from user_account UA ' +
      'LEFT JOIN  (SELECT s.role_id,'+
      'GROUP_CONCAT(s.permission_id) AS permissions  '+
      'FROM user_permissions s '+
      'GROUP BY s.role_id) x ON x.role_id = UA.role_id '+
      'where UA.u_id=? and status=?'
      connection.query(query,[user_id,1],function(err,result){
         if(err)reject(err);
         resolve(result)
      })
  })
 }

 static GetRole(role_name){
    return new Promise((resolve,reject)=>{
       let query='select * from user_roles where role=?';
       connection.query(query,[role_name],function(err,result){
          if(err) reject(err);
          if(result.length>0){
             resolve(true);
          }
          else{
            resolve(false);
          }
       })
    })
 } 
 static Permissions(){
    return new Promise((resolve,reject)=>{
      let permissions=['Create','Read','Update','Delete'];
       resolve(permissions)
    })
 }
}
module.exports={Users};
