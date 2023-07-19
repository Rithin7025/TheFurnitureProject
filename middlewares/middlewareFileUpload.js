
const multer = require('multer')
const path = require('path')


// const storage = multer.diskStorage({
//     destination:(req,files,cb) => {
//       cb(null,'public/uploads')
//     },
//     filename:(req,file,cb)=>{
     
//       cb(null, Date.now() + path.extname(file.originalname))
//     },
    
//   })
  
//   const upload = multer({
//     storage:storage,
//     limits:{
//       fileSize: 10 * 1024 * 1024
//     },
//     fileFilter: function(req,file,cb){
//       let filetypes = /jpeg|jpg|png/;
//       let mimetype = filetypes.test(file.mimetype);
//       let extname = filetypes.test(path.extname(file.originalname))
//       if(mimetype && extname){
//         return cb(null,true);
//       }
//       cb('Error:File upload only supports the following filetypes' + filetypes)
//     }
//   })


const upload = multer({
  dest: "public/uploads",
  limits: {

    fieldSize: 10 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
   
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
     
      const originalExt = path.extname(file.originalname).toLowerCase();
      if (originalExt === ext) {
        cb(null, true); // Accept the file
      } else {
        cb(new Error("Invalid file extension."), false); // Reject the file
      }
    } else {
      cb(new Error("Only image files are allowed."), false); // Reject the file
    }
  },
});


 

  module.exports = upload;