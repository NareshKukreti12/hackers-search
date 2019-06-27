'use strict'
class Responses{
    static Unauthorized(res){
       return res.status(401).send({
            message:"Unauthorized access"
        })
    }
}
module.exports={
    Responses
}