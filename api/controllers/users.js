'use strict'
var connection = require('../db'),
_       = require('lodash'),
 {Users}=require('../user'),
config  = require('../config'),
jwt     = require('jsonwebtoken'),
bcrypt  = require('bcrypt-nodejs');
var frontEndUrl=config.front_end_url;
var adminEmail = "info@prminfotech.com";
var nodemailer = require('nodemailer');  
const Email = require('email-templates');
var transporter = nodemailer.createTransport
({
        service: 'gmail',
        auth: 
        {
            user: config.user,
            pass: config.pass
        }
});
function createResetToken(user) {
    return jwt.sign(_.omit(user, 'userId'), config.secretKey, { expiresIn: 7200000});
}//End of Create Reset Token 
 
function loginToken (user) {
    return jwt.sign(_.omit(user, 'password'), config.secretKey, { expiresIn: 5259492000});
}//End of Create Token


function isUserAuthorize(u_id){
    return new Promise((resolve,reject)=>{
        Users.GetUserByUserId(u_id).then((user)=>{
             if(user[0]["role_id"]==1){
                resolve(true)
             }
             else if(user[0]["permissions"].length>0){
                 let permissions=[];
                 permissions=(user[0]["permissions"]).split(',');
                 if(permissions.indexOf(1)>=0){
                     resolve(true)
                 }
                 else{
                     resolve(false);
                 }
             }
             else{
                 resolve(false);
             }
        },(err)=>{
            reject(err);
        })
    })
    
}
function Permission(role_id,created_by_id,permissions){
    if(permissions.length>0){
         connection.query('update user_permissions set status=? where role_id=?',[0,role_id],function(err,result){
             if(err)throw err;
             let AllPermissions=[];
             for(let i=0;i<permissions.length;i++){
                AllPermissions.push([
                    role_id,
                    permissions[i],
                    created_by_id,
                    1
                ])
             }
             connection.query('insert into user_permissions (role_id,permission_id,created_by,status)values ?',[AllPermissions],function(err,result){
                if(err)throw err;
                console.log("Permissions added successfully");
             })
         })
    }
    
}
module.exports={
    permissions:(req,res)=>{
        if(req.headers && req.headers.authorization){
           let authorization=req.headers.authorization,decoded;
           try{
              decoded=jwt.verify(authorization,config.secretKey);
           }
           catch{
               return res.status(401).send({
                message:"Unauthorized access"
            })
           }
           Users.GetUserByUserId(decoded.id).then(respp=>{
                if(respp[0]["role_id"]==1){
                    connection.query('select * from permissions',function(err,permission){
                        let permissions=[];
                        for(let i=0;i<permission.length;i++){
                            permissions.push({
                                permission_id:permission[i]["permission_id"],
                                permission:permission[i]["value"]
                            })
                        }
                        res.status(200).send({
                            permissions
                        })
                    })
                }
                else{
                    return res.status(401).send({
                        message:"You are not allowed to access this API"
                    })
                }
           },(err)=>{
               console.log("Something went wrong.")
           })
        }
        else{
            res.status(401).send({
                message:"Unauthorized access"
            })
        }
    },
    GetUser:(req,res)=>{

        if(req.headers && req.headers.authorization){
            let authorization=req.headers.authorization,decoded;
            try{
               decoded=jwt.verify(authorization,config.secretKey);

            }
            catch{
                return res.status(401).send({
                    message:"Unauthorized access"
                })
            }          

 
                  
                    Users.Permissions().then(perm=>{
                        let permissions=[]=perm;
                        console.log("All Permissions");
                        let query= 'SELECT ' +
                    'UA.u_id ,'+
                    'UA.email,'+
                    'UA.role_id,'+
                    'UA.source_id,'+
                    'UA.created_date,'+
                    'UA.created_time,'+
                    'UA.created_by_id,'+ 
                    'UAP.first_name,'+
                    'UAP.last_name,'+
                    'UAP.middle_name,'+
                    'UAP.address_line1,'+
                    'UAP.address_line2,'+
                    'UAP.landmark,'+
                    'UAP.state,'+
                    'UAP.country,'+
                    'UAP.pincode,'+
                    'UAP.dob,'+
                    'UAP.gender,'+
                    'UAP.photo, '+
                    'UAC.first_name as created_by_fname,'+
                    'UAC.middle_name as created_by_mname,'+
                    'UAC.last_name as created_by_lname,'+
                    'RC.source_name, UROLE.role,'+
                    'x.permissions '+
                    'from user_account '+
                    'UA LEFT JOIN user_account_personal UAP ON UAP.u_id=UA.u_id '+
                    'LEFT JOIN (SELECT * from user_account_personal) UAC on UAC.u_id= UA.u_id '+ 
                    'LEFT JOIN registration_source RC ON RC.source_id=UA.source_id '+
                    'LEFT JOIN user_roles UROLE on UROLE.role_id=UA.role_id '+
                    'LEFT JOIN  (SELECT s.role_id,'+
                    'GROUP_CONCAT(s.permission_id) AS permissions '+
                    'FROM user_permissions s '+
                    'GROUP BY s.role_id) x ON x.role_id = UA.role_id';
                // where UA.u_id=?

                let types=req.swagger.params.all.value || null;
                if(types!=null && types==1){
                    
                query+=' where UA.role_id!=3 and UA.u_id!='+decoded.id;
                }
                else{
                query+=' where UA.u_id=?';
               
                }
                connection.query(query,[decoded.id],function(err,result){
                    if(err)throw err;
                    let users=[];
                    let user_details=[];                   
                  
                    let user_permissions=[];
                    if(result.length>0){
                      for(let i=0;i<result.length;i++){
                            user_details=[];
                            user_permissions=[];
                            let permission=[]
                           if(result[i]["permissions"])
                           { permission=(result[i]["permissions"]).split(','); }
                             
                            
                            for(let j=0;j<permission.length;j++){
                                 user_permissions.push({
                                    permission_id:Number(permission[j]),
                                     permission:permissions[Number(permission[j])-1]
                                 })
                             }
                            user_details.push({

                                email: result[i]["email"],
                                first_name:result[i]["first_name"]==null?"N/A":result[i]["first_name"],
                                middle_name:result[i]["middle_name"]==null?"N/A":result[i]["middle_name"],
                                last_name:result[i]["last_name"]==null?"N/A":result[i]["last_name"],
                                address_line1: result[i]["address_line1"]==null?"N/A":result[i]["address_line1"],
                                address_line2:result[i]["address_line2"]==null?"N/A":result[i]["address_line2"],
                                landmark: result[i]["landmark"]==null?"N/A":result[i]["landmark"],
                                state: result[i]["state"]==null?"N/A":result[i]["state"],
                                country: result[i]["country"]==null?"N/A":result[i]["country"],
                                pincode: result[i]["pincode"]==null?"N/A":result[i]["address_line1"],
                                dob: result[i]["dob"]==null?"N/A":result[i]["dob"],
                                gender: result[i]["gender"]==null?"N/A":result[i]["gender"],
                                photo: result[i]["photo"]==null?"N/A":result[i]["photo"]                            
                            })
                            users.push({
                                u_id: result[i]["u_id"],
                                role_id: result[i]["role_id"],
                                role: result[i]["role"],
                                source_id: result[i]["source_id"],
                                source_name: result[i]["source_name"],
                                created_by_id: result[i]["created_by_id"],
                                created_by_fname: result[i]["created_by_fname"],
                                created_by_mname: result[i]["created_by_mname"]==null?"N/A":result[i]["created_by_mname"],
                                created_date: result[i]["created_date"]==null?"N/A":result[i]["created_date"],
                                created_time: result[i]["created_time"]==null?"N/A":result[i]["created_time"],
                                user_details ,
                                user_permissions 
                            })
                           
                      }//End of i
                      res.status(200).send({
                          users
                      })
                     }
                     else{
                         res.status(204).send({
                             message:"No data found!"
                         })
                     }
                   // console.log(users)
                    })
                 })
                    

        }
        else{
            return res.status(401).send({
                message:"Unauthorized access"
            })
        }
          
    },
    CreateRoles:(req,res)=>{
          if(req.headers && req.header.authorization){
             let authorization=req.headers.authorization,decoded;
             try{
                 decoded=jwt.verify(authorization,config.secretKey);
             }catch{
               return res.status(401).send({
                    message:"Unuthorized access"
                })
             }
             Users.GetUserByUserId(decoded.id).then(user=>{
                let permissions=[];
                if(users[0])
                if(users[0]["permissions"]){
                    permissions=(users[0]["permissions"]).split(',');
                }

                
             })
          }
          else{
              res.status(401).send({
                  message:"Unuthorized access"
              })
          }
    },

    UserRoles:(req,res)=>{
        Users.Permissions().then(perm=>{
            console.log(perm);
            let query='select UA.*,x.permissions from user_roles UA '+
            'LEFT JOIN  (SELECT s.role_id,s.status ,'+
            'GROUP_CONCAT(s.permission_id) AS permissions '+  
            'FROM user_permissions s '+
            'GROUP BY s.role_id) x ON x.role_id = UA.role_id '+
            'where x.status=?'
            connection.query(query,[1],function(err,result){
                let roles=[];
                for(let i=0;i<result.length;i++){
                    let allPerms=[];
                    let permissions=[];
                    if(result[i]["permissions"].length>0){
                     allPerms=result[i]["permissions"].split(',');
                    }
                    for(let j=0;j<allPerms.length;j++){
                       permissions.push({ 
                           permission_id:Number(allPerms[j]),
                          permission:perm[allPerms[j]-1]
                       })
                    }
                    console.log("Permissions",permissions)
                    roles.push({
                        role_id:result[i]["role_id"],
                        role:result[i]["role"],
                        permissions
                    })
                }
                res.status(200).send({
                    roles
                })
            })
        })
        
    },
     UpdateUser:(req,res)=>{
         if(req.headers  && req.headers.authorization){
            let authorization=req.headers.authorization,decoded;
            try{
               decoded=jwt.verify(authorization,config.secretKey);
            }
            catch{
               return res.status(401).send({
                    message:"Unauthorized access"
                });
            }            	
            
                let u_id=req.swagger.params.user.value.u_id,
                first_name=req.swagger.params.user.value.first_name,
                middle_name=req.swagger.params.user.value.middle_name,
                last_name=req.swagger.params.user.value.last_name,
                address_line1=req.swagger.params.user.value.address_line1,
                address_line2=req.swagger.params.user.value.address_line2,
                landmark=req.swagger.params.user.value.landmark,
                city=req.swagger.params.user.value.city,
                state=req.swagger.params.user.value.state,
                country=req.swagger.params.user.value.country,
                pincode=req.swagger.params.user.value.pincode,
                dob=req.swagger.params.user.value.dob,
                gender=req.swagger.params.user.value.gender,
                photo=req.swagger.params.user.value.photo,
                modified_by_id=decoded.id,
                modified_date=new Date(),
                modified_time=new Date()
                let query='update user_account_personal SET '+
                          'first_name=?,'+
                          'middle_name=?,'+
                          'last_name=?,'+
                          'address_line1=?,'+
                          'address_line2=?,'+
                          'landmark=?,'+  
                          'city=?,'+
                          'state=?,'+
                          'country,'+
                          'pincode,'+
                          'dob,'+
                          'gender,'+
                          'photo,'+
                          'modified_by_id=?,'+
                          'modified_date=?,'+
                          'modified_time=? '+
                          'where u_id=?';
                 connection.query(query,[
                     first_name,
                     middle_name,
                     last_name,
                     address_line1,
                     address_line2,
                     landmark,
                     city,
                     state,
                     country,
                     pincode,
                     dob,
                     gender,
                     photo,
                     modified_by_id,
                     modified_date,
                     modified_time,
                     u_id
                 ],function(err,result){
                      if(err)throw err;
                      console.log("Success");
                 })           
         }
         else{
             res.status(401).send({
                 message:"Unauthorized access"
             });
         }
     },
     CreateRoles:(req,res)=>{
         if(req.headers && req.headers.authorization){
             let authorization=req.headers.authorization,decoded;  
            try
              {
                  decoded=jwt.verify(authorization,config.secretKey);
              }
              catch{
                return     res.status(401).send({
                    message:"Unauthorized access"
                })
              }
              isUserAuthorize(decoded.id).then(respp=>{
                  if(respp==true){
                    let roles=req.swagger.params.user.value.roles;
                    let role_name=roles[0]["role"];
                    Users.GetRole(role_name).then(isExists=>{
                        console.log("Exists",isExists);
                        if(isExists==false){
                          
                           let user_roles={
                               role:role_name
                           }
                          
                           connection.query('insert into user_roles SET?',[user_roles],function(err,result){
                               if(err)throw err;
                               res.status(200).send({
                                   success:true,
                                   message:"New role has been added successfully"
                                });                             
                               Permission(result.insertId,decoded.id,roles[0]["permissions"]);
                               //insertId
                           })
                        }
                        else{
                            res.status(200).send({
                                success:false,
                                message:"Role name already exists"
                            })
                        }
                    });
                  }
                  else{
                    res.status(200).send({
                        success:false,
                        message:"User don't have permission to add roles"
                     });    
                  }
                
              })
         }
         else{
             res.status(401).send({
                 message:"Unauthorized access"
             })
         }
     }
}



