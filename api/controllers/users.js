'use strict'
var connection = require('../db'),
_       = require('lodash'),
 {Users}=require('../user'),
 {Responses}=require('../responses'),
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


function isUserAuthorize(u_id,permission_id){
    return new Promise((resolve,reject)=>{
        Users.GetUserByUserId(u_id).then((user)=>{
             if(user[0]["role_id"]==1){
                resolve(true)
             }
             else if(user[0]["permissions"].length>0){
                 let permissions=[];
                 permissions=(user[0]["permissions"]).split(',');
                 if(permissions.indexOf(permission_id)>=0){
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
             Responses.Unauthorized(res);
           }
           connection.query('select * from permissions',function(err,permission)
           {
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
           Responses.Unauthorized(res);
        }
    },
    GetUser:(req,res)=>{

        if(req.headers && req.headers.authorization){
            let authorization=req.headers.authorization,decoded;
            try{
               decoded=jwt.verify(authorization,config.secretKey);

            }
            catch{
               Responses.Unauthorized(res);
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
                    'UAP.city,'+
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
                    'FROM user_permissions s where s.status=1 '+
                    'GROUP BY s.role_id ) x ON x.role_id = UA.role_id';
                // where UA.u_id=?

                let types=req.swagger.params.user.value || null;
                if(types!="me"){
                    
                query+=' where UA.role_id!=3 and UA.u_id!='+decoded.id +' and UA.status=1 order by UA.u_id DESC';
                }
                else{
                query+=' where UA.u_id=?'+' and UA.status=1 order by UA.u_id DESC';
               
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
                                city: result[i]["city"]==null?"N/A":result[i]["city"],
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
                      console.log(users);
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
           Responses.Unauthorized(res);
        }
          
    },
    CreateRoles:(req,res)=>{
          if(req.headers && req.header.authorization){
             let authorization=req.headers.authorization,decoded;
             try{
                 decoded=jwt.verify(authorization,config.secretKey);
             }catch{
               Responses.Unauthorized(res);
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
           Responses.Unauthorized(res);
          }
    },

    UserRoles:(req,res)=>{
        Users.Permissions().then(perm=>{
            console.log(perm);
            let query='select UA.*,x.permissions from user_roles UA '+
            'LEFT JOIN  (SELECT s.role_id,s.status ,'+
            'GROUP_CONCAT(s.permission_id) AS permissions '+  
            'FROM user_permissions s '+
            'GROUP BY s.role_id,s.status) x ON x.role_id = UA.role_id '+
            'where x.status=?'
            connection.query(query,[1],function(err,result){
                if(err)throw err;
                let roles=[];
                console.log(result);
                if(result.length==0){
                    return res.status(204).send({
                        message:"No roles found"
                    })
                }
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
               Responses.Unauthorized(res);
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
                modified_time=new Date(),
                role_id=req.swagger.params.user.value.role_id;
                let query='update user_account_personal SET '+
                          'first_name=?,'+
                          'middle_name=?,'+
                          'last_name=?,'+
                          'address_line1=?,'+
                          'address_line2=?,'+
                          'landmark=?,'+  
                          'city=?,'+
                          'state=?,'+
                          'country=?,'+
                          'pincode=?,'+
                          'dob=?,'+
                          'gender=?,'+
                          'photo=?,'+
                          'modified_by_id=?,'+
                          'modified_date=?,'+
                          'modified_time=? '+
                          'where u_id=?';
              connection.query('select * from user_account_personal where u_id=?',[u_id],function(err,user_audit_trail){
                      if(err)throw err;
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
                      console.log("user details updated")
                      res.status(200).send({
                          success:true,
                          message:'User details has been updated successfully'
                      });
                    
                      let date=new Date()
                   console.log("Role Id",role_id)
                   connection.query('update user_account set role_id=?,modified_by_id=?,modified_on=? where u_id=?',[role_id,modified_by_id,date,u_id],function(err,result){
                       if(err)throw err;
                       console.log("User role updated successfully!");
                   })   
                   
                    let audit_trail={
                            u_id:user_audit_trail[0]["u_id"],
                            first_name:user_audit_trail[0]["first_name"],
                            middle_name:user_audit_trail[0]["middle_name"],
                            last_name:user_audit_trail[0]["last_name"],
                            address_line1:user_audit_trail[0]["address_line1"],
                            address_line2:user_audit_trail[0]["address_line2"],
                            landmark:user_audit_trail[0]["landmark"],
                            city:user_audit_trail[0]["city"],
                            state:user_audit_trail[0]["state"],
                            country:user_audit_trail[0]["country"],
                            pincode:user_audit_trail[0]["pincode"],
                            dob:user_audit_trail[0]["dob"],
                            photo:user_audit_trail[0]["photo"],
                            created_by_id:user_audit_trail[0]["created_by_id"],
                            gender:user_audit_trail[0]["gender"],
                            modified_by_id:user_audit_trail[0]["modified_by_id"],
                            created_date:user_audit_trail[0]["created_date"],
                            created_time:user_audit_trail[0]["created_time"],
                            modfied_date:user_audit_trail[0]["modfied_date"],
                            modifed_time:user_audit_trail[0]["modifed_time"],
                            status:user_audit_trail[0]["status"]
                    }
                 connection.query('insert into user_account_personal_audit_trail SET ?',[audit_trail],function(err,result){
                     if(err) throw err;
                     console.log("User account personal audit trail");
                 })   

                })  
            })           
         }
         else{
           Responses.Unauthorized(res);
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
               Responses.Unauthorized(res);
              }
              isUserAuthorize(decoded.id,1).then(respp=>{
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
                        message:"You don't have permission to add roles"
                     });    
                  }
                
              })
         }
         else{
           Responses.Unauthorized(res);
         }
     },
     ModifyRole:(req,res)=>{
         if(req.headers && req.headers){
            let authorization=req.heades.authorization,decoded;
            try
            {
              decoded=jwt.verify(authorization,config.secretKey);  
            }
            catch{
                Responses.Unauthorized(res);
            }
            isUserAuthorize(decoded.id,3).then(respp=>{
                let u_id=req.swagger.params.u_id.value;
                let role_id=req.swagger.params.role_id.value;
                if(respp==true){
                  let roles=req.swagger.params.user.value.roles;
                  let role_name=roles[0]["role"];
                    
                  

                  } 
                  else{
                    res.status(200).send({
                        success:false,
                        message:"You don't have permission to modify roles"
                     });    
                  }
            }) 
           
         
         }
         res.status(401).send({
            message:"Unauthorized access"
        })
     },
     DeleteUser:(req,res)=>{
         if(req.headers && req.headers.authorization){
            let authorization=req.headers.authorization,decoded; 
            try{
                 decoded=jwt.verify(authorization,config.secretKey);
             }
             catch{
                 Responses.Unauthorized(res);
             }
             let user_id=req.swagger.params.user_id.value;
             isUserAuthorize(decoded.id,4).then(resp=>{
                 if(resp==false) {
                     return res.status(200).send({
                         success:false,
                         message:"User don't have premission to delete user(s)"
                     })
                 }
             })

            
             connection.query('update user_account set status=?,modified_by_id=?,modified_on=? where u_id=?',[
              0,decoded.id,new Date(),user_id
            ],function(err,result){
                if(err) throw err;
                res.status(200).send({
                    success:true,
                    message:"User deleted successfully"
                })
            })  
         }
         else{
           Responses.Unauthorized(res);
         }
     },
     UpdateRole:(req,res)=>{
        if(req.headers && req.headers.authorization){
            let authorization=req.headers.authorization,decoded; 
            try
            {
               decoded=jwt.verify(authorization,config.secretKey);
            }catch(e){
                Responses.Unauthorized(res);
            }
            isUserAuthorize(decoded.id,3).then(resp=>{
                if(resp==false){
                    return res.status(200).send({
                        success:false,
                        message:"User don't have premission to update"
                    })
                   
                }
                let role_id=req.swagger.params.user.value.role_id;
                   let permissions=req.swagger.params.user.value.permissions;
                   console.log("Role id",role_id," Permissions",permissions);
                   connection.query('update user_permissions set status=? where role_id=?',[0,role_id],function(err,result){
                       if(err)throw err;
                       let user_permissions=[];
                       for(let i=0;i<permissions.length;i++){
                           user_permissions.push([ 
                                role_id,
                                permissions[i],
                                decoded.id,                               
                                1
                           ])
                       }
                       connection.query('insert into user_permissions(role_id,permission_id,created_by,status) values ? ',[user_permissions],function(err,result){
                           if(err)throw err;
                           res.status(200).send({
                               success:true,
                               message:"Permissions updated successfully"
                           })
                       })
                   })
            })
         }
         else{
           Responses.Unauthorized(res);
         }
     },
     Me:(req,res)=>{
         if(req.headers && req.headres.authorization){
            let authorization=req.headers.authorization,decoded;
            try{
                decoded=jwt.verify(authorization,config.secretKey);
            } 
            catch{
                Responses.Unauthorized(res)
            }

         }
         else{
             Responses.Unauthorized(res)
         }
     }
}



