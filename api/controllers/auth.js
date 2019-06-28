'use strict'
var connection = require('../db'),
_       = require('lodash'),
 {Users}=require('../user'),
config  = require('../config'),
jwt     = require('jsonwebtoken'),
bcrypt  = require('bcrypt-nodejs'),
{Responses}=require('../responses');
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


function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}
function createResetToken(user) {
    return jwt.sign(_.omit(user, 'userId'), config.secretKey, { expiresIn: 7200000});
}//End of Create Reset Token 
 
function loginToken (user) {
    return jwt.sign(_.omit(user, 'password'), config.secretKey, { expiresIn: 5259492000});
}//End of Create Token

function parseDate(dateStr, format) {
    const regex = format.toLocaleLowerCase()
      .replace(/\bd+\b/, '(?<day>\\d+)')
      .replace(/\bm+\b/, '(?<month>\\d+)')
      .replace(/\by+\b/, '(?<year>\\d+)')
    
    const parts = new RegExp(regex).exec(dateStr) || {};
    const { year, month, day } = parts.groups || {};
    return parts.length === 4 ? new Date(year, month-1, day) : undefined;
  }
function CreateNewUser(res,req,created_by){
    let d=new Date();
    let date=d.getFullYear()+"/"+d.getMonth()+"/"+d.getDate();
    console.log(new Date().toLocaleTimeString());
   console.log(parseDate("05/11/1896",'dd/mm/YYYY'));
    let email=req.swagger.params.user.value.email;
    let role_id=req.swagger.params.user.value.role_id;
    let source_id=req.swagger.params.user.value.source_id;
    let password=req.swagger.params.user.value.password;
    let created_time=new Date();
    let created_date=new Date();
    let created_by_id=created_by;
    let status=1;
    let first_name=req.swagger.params.user.value.first_name;
    let middle_name=req.swagger.params.user.value.middle_name;
    let last_name=req.swagger.params.user.value.last_name;
    let address_line1=req.swagger.params.user.value.address_line1;
    let address_line2=req.swagger.params.user.value.address_line2;
    let landmark=req.swagger.params.user.value.landmark;
    let city=req.swagger.params.user.value.city;
    let state=req.swagger.params.user.value.state;
    let country=req.swagger.params.user.value.country;
    let pincode=req.swagger.params.user.value.pincode;
    let dob=req.swagger.params.user.value.dob;
    let gender=req.swagger.params.user.value.gender;
    let photo=req.swagger.params.user.value.photo;
    let permisssions=[];
    permisssions=req.swagger.params.user.value.permissions;  
     if(source_id==1){
         //If user registered from email address
         if(role_id!=3){
             password=generatePassword();
         }
        } 
         if(password==null&& source_id==1){
             return res.status(200).send({
                 message:"Password required",
                 success:false
             })
         }
        //  if(role_id!=3){
        //      if(permisssions==null || permisssions.length==0){
        //          return res.status(200).send({
        //              success:false,
        //              message:"Permissions required"
        //          })
        //      }
        //  }
         console.log("Password is",password);
         bcrypt.hash(password,null,null,function(err,hash){
             let user_id;
             if(err)throw err;
             console.log(hash);
            let  user_account;
            if(source_id==1){
                user_account={
                    email:email,
                    password:hash,
                    role_id:role_id,
                    source_id:source_id,
                    status:status,
                    created_by_id:created_by_id,
                    created_date:created_date,
                    created_time:created_time
                }
            }
            else{
                user_account={
                    email:email,
                    role_id:role_id,
                    source_id:source_id,
                    status:status,
                    created_by_id:created_by_id,
                    created_date:created_date,
                    created_time:created_time
                }
            }
            connection.query('insert into user_account SET ?',[user_account],function(err,result){
                if(err)throw err;
                console.log("Insert Id", result.insertId);
                let user_account_personal={
                    address_line1:address_line1,
                    address_line2:address_line2,
                    city:city,
                    country:country,
                    created_by_id:created_by_id,
                    created_date:created_date,
                    created_time:created_time,
                    dob:dob,
                    first_name:first_name,
                    gender:gender,
                    landmark:landmark,
                    last_name:last_name,
                    middle_name:middle_name,
                    photo:photo,
                    pincode:pincode,
                    state:state,
                    status:status,
                    u_id:result.insertId
                }
                user_id=result.insertId;
                let token=createResetToken({
                    id:result.insertId
                })
                connection.query('insert into user_account_personal SET ?',[user_account_personal],function(err,user){
                   if(err)throw err;
                    console.log("Success");
                    let name=first_name+" "+last_name;
                    if(role_id==1){
                        res.status(200).send({
                            success:true,
                            message:"New user has been created successfully!"
                        })
                       // Permission(user_id,created_by_id,permisssions);
                    }
                    else{
                        res.status(200).send({
                            success:true,
                            message: source_id==1?"Your account has been created successfully. A verificatin mail has been sent to your email address, kindly confirm your email!":"Your account has been created succesully!"
                        })
                       UserClaims(email,user_id)
                    }
                    let type=1;
                    
                    sendMail(email,name,token,password,1,source_id);
                }) 
            })
         })
        

    //  }
    //  else{
    //     //If user registered from social accounts(i.e Facebook, Google)
    //  }


}
function UserClaims(email,u_id){
   let user_claims={
   email:email,
   email_confirmed:0,
   user_name:email,
   u_id:u_id
   }
   connection.query('insert into user_claims SET ?',[user_claims],function(err,result){
       if(err)throw err;
       console.log("User claims --> Inserted");
   })
}
function Permission(userid,created_by_id,permissions){
    if(permissions.length>0){
         connection.query('update user_permissions set status=? where u_id=?',[0,userid],function(err,result){
             if(err)throw err;
             let AllPermissions=[];
             for(let i=0;i<permissions.length;i++){
                AllPermissions.push([
                    userid,
                    1,
                    permissions[i],
                    created_by_id,
                    1
                ])
             }
             connection.query('insert into user_permissions (u_id,role_id,permission_id,created_by,status)values ?',[AllPermissions],function(err,result){
                if(err)throw err;
                console.log("Permissions added successfully");
             })
         })
    }
    
}

function sendMail(email,name,resetToken,password,type,source_id){                    
    var testMailTemplate = new Email()
        let locals ='';
         let subject='';
            let template_location='';
           if(type==1){
              template_location='./../public/new_account.ejs';
              locals = { 
                userName: name,             
                link:frontEndUrl+"/verified"+"/"+resetToken,
                email:email,
                password:password,
                source_id:source_id
               };
               subject="Hackers-Search: Registration";
           } 
           else if(type==2){
            template_location='./../public/reset_password.ejs';
            locals = { 
              userName: name,             
              link:frontEndUrl+"/resetPassword"+"/"+resetToken
             };
             subject="Hackers-Search: Forgot Password";
           }
         testMailTemplate
         .render(template_location,locals)
         .then((result)=>{
             //console.log(result);
            var mailOptions = {
                from: adminEmail,
                to: email,
                subject: subject,                           
                html:result
              };
    
            transporter.sendMail(mailOptions, function(error, info){
            if (error) {
            }
            else {                         
            console.log("Success")           
            }
           });
         })
         .catch(console.error);
        
   
        
}//End of Send Mail

function UpdatePassword(new_password,old_password,u_id,res,type){
    bcrypt.hash(new_password,null,null,function(err,hash){
        let user_credential_trail={
            u_id:u_id,
            password:old_password,
            modified_by:u_id,
            modified_date:new Date(),
            modified_time:new Date()
        }
        console.log(hash);
           connection.query('update user_account set password=? where u_id=?',[hash,u_id],function(err,pwd_response){
              if(err)throw err;
              type==0? res.status(200).send({
                   success:true,
                   message:"Your password updated successfully!"
               }) : console.log("New password updated")
               connection.query('insert into user_credential_trail SET ?',[user_credential_trail],function(err,trail){
                   console.log("success");
               })
           })
       })
}


 




module.exports={


    RegSources:(req,res)=>{
      connection.query('select * from registration_source',function(err,result){
          let sources=[];
          for(let i=0;i<result.length;i++){
            sources.push({
                source_id:result[i]["source_id"],
                source_name:result[i]["source_name"]
            })
          }
          res.status(200).send({sources});
      })
    },

    CreateAccount:(req,res)=>{
        let email=req.swagger.params.user.value.email;
        Users.GetUserByEmail(email).then(user=>{
              if(user.length>0){
                  return res.status(200).send({
                      success:false,
                      message:"User already exists"
                  })
              }

             if(req.headers && req.headers.authorization){
                 let authorization=req.headers.authorization,decoded;
                 try
                 {
                     decoded=jwt.verify(authorization,config.secretKey)
                 }
                 catch
                 {
                       Responses.Unauthorized(res);
                 }
                 Users.GetUserByUserId(decoded.id).then(response=>{
                     
                        if(response[0]["role_id"]==1){
                            CreateNewUser(res,req,1);
                            // let permission=req.swagger.params.user.value.permissions;
                            // console.log(permission[0]);

                        }
                        else{
                            Responses.Unauthorized(res);
                        }
                 },(err)=>{
                    
                 })
             }
             else{
                 console.log("Inside else")
                CreateNewUser(res,req,0);
             } 
         },(err)=>{
             console.log("Error",err);
         })
    },
    login:(req,res)=>{
        let email=req.swagger.params.user.value.email;
        let password=req.swagger.params.user.value.password;
        let source_id=req.swagger.params.user.value.source_id;
        console.log(email);
     //   console.log(password)
        let query='select u_id,password from user_account where email=? and status=? and source_id=?';
        connection.query(query,[email,1,source_id],function(err,result){
            if(err)throw err;
           if(result.length>0){
               console.log("Inide if");
                 console.log(result[0]["password"])
             if(source_id==1){
                 if(password==null || password.length==0){
                     return res.status(200).send({
                        success:fasle,
                        message:"Password required"
                    })
                 }
                bcrypt.compare(password,result[0]["password"],function(errr,respp){
                    console.log(respp);
      
                      if(respp){
                      
                      let user={
                          id:result[0]["u_id"]
                      }
                      let token=loginToken(user);
                      console.log("Login Token=",token);
                      res.status(200).send({
                          success:true,
                          message:"success",
                          token:token
                      })
                   }
                   else{
                       res.status(200).send({
                           success:false,
                           message:"Invalid password "
                       })
                   }
                  })
             }
             else{
                let user={
                    id:result[0]["u_id"]               
                 }
                let token=loginToken(user);
                res.status(200).send({
                    success:true,
                    message:"success",
                    token:token
                })
             }         
           }
          else{
              res.status(200).send({
                  success:false,
                  message:"Invalid email address"
              })
          }
        })
    },
    me:(req,res)=>{
        if(req.headers && req.headers.authorization){
            let authorization=req.headers.authorization,decoded;
            try{
                decoded=jwt.verify(authorization,config.secretKey);
            }
            catch{
                Responses.Unauthorized(res);
            }
            
        }
        else{
            Responses.Unauthorized(res);
        }
    },
    verifyEmail:(req,res)=>{
        let token=req.swagger.params.verify_token.value;
        
        console.log(token);
        if(token){
            let decoded;
            try{
                decoded=jwt.verify(token,config.secretKey);
            }
            catch(err){
                console.log(err)
                Responses.Unauthorized(res);
            }
            connection.query('update user_claims set email_confirmed=? where u_id=?',[1,decoded.id],function(err,result){
                if(err)throw err;
                res.status(200).send({
                    success:true,
                    message:"Your account has been verified successfully"
                })
            })
        }
        else{
            res.status(401).send({
                message:"Verification token required"
            })
        }
      
    },
    update_password:(req,res)=>{
        if(req.header && req.headers.authorization){
            let authorization=req.headers.authorization,decoded; 
            try{
                decoded=jwt.verify(authorization,config.secretKey);
             }
             catch{
                Responses.Unauthorized(res);
             }
            let current_password=req.swagger.params.user.value.current_password;
            let new_password=req.swagger.params.user.value.new_password;
            Users.GetUserByUserId(decoded.id).then(result=>{
                    bcrypt.compare(current_password,result[0]["password"],function(err,respp){
                        if(respp){
                           console.log("Success",result[0]);
                           let user_credential_trail={
                               u_id:result[0]["u_id"],
                               password:result[0]["password"],
                               modified_by:decoded.id,
                               modified_date:new Date(),
                               modified_time:new Date()
                           }
                        //    bcrypt.hash(new_password,null,null,function(err,hash){
                        //     console.log(hash);
                        //        connection.query('update user_account set password=? where u_id=?',[hash,decoded.id],function(err,pwd_response){
                        //            res.status(200).send({
                        //                success:true,
                        //                message:"Your password updated successfully!"
                        //            })
                        //            connection.query('insert into user_credential_trail SET ?',[user_credential_trail],function(err,trail){
                        //                console.log("success");
                        //            })
                        //        })
                        //    })
                        UpdatePassword(new_password,result[0]["password"],result[0]["u_id"],res,0)
                        }
                        else{
                            res.status(200).send({
                                success:false,
                                message:"Invalid password "
                            })
                        }
                    })               
            })

        }
        else{
            Responses.Unauthorized(res);
        }
    },
    forgot_password:(req,res)=>{
        let email=req.swagger.params.user.value.email;
        Users.GetUserByEmail(email).then(user=>{
             if(user.length==0){
                return res.status(204).send({
                    message:"No such user exists!"
                })
             }
             console.log(user[0]["u_id"]);
             let userd={
                 id:user[0]["u_id"]
             }
             let resetToken=createResetToken(userd);
             console.log("Reset Token",resetToken)
            //  let reset_token={
            //      id:createResetToken(user[0]["u_id"])
            //  }
           let name=user[0]["first_name"]+" "+user[0]["last_name"]
           res.status(200).send({
               success:true,
               message:"A password reset message was sent to your email address. Please click the link in that message to reset your password."
           })
           sendMail(email,name,resetToken,"",2,1);
        })
    },
    reset_password:(req,res)=>{
        let token=req.swagger.params.user.value.token;
        let password=req.swagger.params.user.value.password;
        
        let decoded;
        try{
            decoded=jwt.verify(token,config.secretKey);
        }
        catch{
            Responses.Unauthorized(res);
        }
        console.log(decoded.id);
        Users.GetUserByUserId(decoded.id).then(userdetails=>{
            if(userdetails.length==0){
                return res.status(204).send({
                message:"No user found"
            })
           }
           bcrypt.hash(password,null,null,function(err,hash){
               connection.query('update user_account set password=?,modified_by_id=?,modified_on=? where u_id=?',
               [hash,decoded.id,new Date(),decoded.id],function(err,result){
                   if(err)throw err;
                   res.status(200).send({
                       success:true,
                       message:"You have successfully reset your password. You can now login using your new password"
                   })
                   let cred_audit_trail={
                        u_id:decoded.id,
                        password:userdetails[0]["password"],
                        modified_by:userdetails[0]["modified_by"],
                        modified_time:userdetails[0]["modified_time"]
                   }
                   connection.query("insert into user_credential_trail SET ?",[cred_audit_trail],function(err,result){
                     if(err)throw err; 
                    console.log("Password audit trails");
                   })
               })
           })
        })
    },
    ResendVerification:(req,res)=>{
        let email=req.swagger.params.user.value.email;
        Users.GetUserByEmail(email).then(user=>{
            if(user[0]["email_confirmed"]==0){
                let token=createResetToken({
                    id:user[0]["u_id"]
                })
                res.status(200).send({
                    success:false,
                    message:"A verificatin mail has been sent to your email address, kindly confirm your email!"
                })
                let password=generatePassword();
                UpdatePassword(password,user[0]["password"],user[0]["u_id"],res,1)
                sendMail
                (
                      user[0]["email"],
                      user[0]["first_name"]+" "+user[0]["last_name"],
                      token,password,
                      1,
                      user[0]["source_id"]
                );
                //console.log(token);
            }
            else{
                res.status(200).send({
                    success:false,
                    message:"This account is already verified!"
                })
            }
        })
    }
   
 
}
