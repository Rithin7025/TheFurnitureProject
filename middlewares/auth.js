
const isLogin = async(req,res,next)=>{

  try {

    if(req.session.user_id){

      next();

    }

    
    else{

      res.render('users/login');

    }
    
  } catch (error) {

    console.log("Error From isLogin Middleware", error);

  }


}




module.exports = {
  isLogin
}