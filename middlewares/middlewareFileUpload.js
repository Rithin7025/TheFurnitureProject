
const multer = require('multer')
const path = require('path')


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