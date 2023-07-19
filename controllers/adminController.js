const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Product = require("../models/productModel");
const sharp = require("sharp");
const Order = require('../models/orderModel');
const Jimp = require("jimp");


const Category = require("../models/categoryModel");
const fs = require("fs");

const path = require("path");

//for rendering admin login page
const loadLogin = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

//for verifying the admin is true or not
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("admin/login", {
            message: "password and email incorrect",
          });
        } else {
          req.session.admin_id = userData._id;
          res.render("admin/home");
        }
      } else {
        res.render("admin/login", { message: "password and email incorrect" });
      }
    } else {
      res.render("admin/login", { message: "Email and password incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    



    res.render("admin/home");
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
//for loading the users in db
const usersListLoad = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: 0 });

    res.render("admin/usersList", { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log(user_id);
    const is_blocked = await User.findByIdAndUpdate(user_id, {
      $set: { is_blocked: true },
    });
    console.log(is_blocked);
    res.redirect("/admin/usersList");
    console.log("user blocked");
  } catch (error) {}
};

const unblockUser = async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log(user_id);
    const is_blocked = await User.findByIdAndUpdate(user_id, {
      $set: { is_blocked: false },
    });
    console.log(is_blocked);
    res.redirect("/admin/usersList");
    console.log("user unblocked");
  } catch (error) {}
};

//for adding new Category
const addCategory = async (req, res) => {
  try {
    console.log('req body in ac,',req.body);
    const name = req.body.categoryName;
    console.log(name)
    const file = req.file;
    console.log(file)
    const filepath = file.path;

    const relativePath = path.relative("public", filepath);
    console.log('relative path',relativePath);

    
    const category = new Category({
      name: name,
      image: relativePath,
    });

    await category.save();

    res.render("admin/category-success");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error adding category");
  }
};

const showCategoryTable = async (req, res) => {
  try {
    const category = await Category.find();

    res.render("admin/category", { category });
  } catch (error) {
    console.log(error.message);
  }
};

//=================================================================================================================================
//for adding product from the admin

// const addProduct = async (req, res) => {
//     try {
//       const name = req.body.productName;
//       const price = req.body.productPrice;
//       const filename = req.file.filename;

//       const description = req.body.productDescription;

//       const productcategory = req.body.productCategory

//       const product = new Product({
//         name: name,
//         price: price,
//         image: filename,
//         description: description,
//         category : productcategory

//       });
//       await product.save();

//       res.render('admin/product-success.hbs'); // Redirect to the desired page after successful product creation
//     } catch (error) {
//       console.log(error.message);
//       // Handle the error appropriately
//     }
//   };
//==============================================================================//

// const addProduct = async (req, res) => {
//     try {
//       const { productName: name, productPrice: price, productDescription: description, productCategory: category } = req.body;
//       const photos = req.files.map((file) => {
//         const oldPath = file.path;
//         const newPath = `${file.path}.png`;

//         fs.renameSync(oldPath, newPath);
//         return newPath.replace(/public/gi, '');
//       });

//       const product = new Product({
//         name: name,
//         price: price,
//         image: photos, // Assign the array of file paths directly
//         description: description,
//         category: category,
//       });

//       await product.save();

//       res.render('admin/product-success.hbs');
//     } catch (error) {
//       console.log(error.message);
//       // Handle the error appropriately
//     }
//   };

const addProduct = async (req, res) => {
  try {
    
    const {
      productName: name,
      productPrice: price,
      productDescription: description,
      productCategory: category,
      productStock 
    } = req.body;
    const photos = req.files.map((file) => {
      const oldPath = file.path;
      const newPath = `${file.path}.png`;
      fs.renameSync(oldPath, newPath);
      return newPath.replace(/public/gi, "");
    });

    // Resize the images using Sharp
    for (const photo of photos) {
      await sharp(`public/${photo}`)
        .resize(800, 800)
        .toBuffer((err, buffer) => {
          if (err) throw err;
          try {
            fs.writeFileSync(`public/${photo}`, buffer);
          } catch (error) {
            console.error("Error writing file:", error);
          }
        });
    }



    const product = new Product({
      name: name,
      price: price,
      image: photos,
      description: description,
      category: category,
     stockQuantity : productStock
    });

    console.log('as - New product with stock==', product);

    await product.save();

    res.render("admin/product-success.hbs");
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately
  }
};

//=============================================================================================================//

// for rendering product page
const ProductPageLoad = async (req, res) => {
  try {
    //fetch the data from database and pass it
    const product = await Product.find();
    res.render("admin/productpage", { product });
  } catch (error) {
    console.log(error.message);
  }
};




//Product API
async function productsDisplay(req,res){
  try{
    const products = await Product.find();
    res.json({prs:products})
  }catch(err){
    console.log(err)
  }
}

//hiding category by getting the id passed from the form and fetching it by req.params(where the id is in the url :id)

const hideCategory = async (req, res) => {
  try {
    const category_id = req.params.id;
    const categoryBlock = await Category.findOneAndUpdate(
      { _id: category_id },
      { $set: { is_hide: true } }
    );

    res.redirect("/admin/category");
    console.log(categoryBlock);
  } catch (error) {
    console.log(error.message);
  }
};

//unhide category

const unhideCategory = async (req, res) => {
  try {
    const category_id = req.params.id;
    const categoryBlock = await Category.findOneAndUpdate(
      { _id: category_id },
      { $set: { is_hide: false } }
    );

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

// const hideProduct = async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const productDetails = await Product.findOneAndUpdate(
//       { _id: productId },
//       { $set: { is_blocked: true } }
//     );

//     res.redirect("/admin/product");
//   } catch (error) {}
// };

// const displayProduct = async (req, res) => {
//   try {
//     const productId = req.params.id;
//     await Product.findOneAndUpdate(
//       { _id: productId },
//       { $set: { is_blocked: false } }
//     );

//     res.redirect("/admin/product");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

//hide unhide in a single button==========================================================
const hideUnhideProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('aC 333',productId)
    const productDetails = await Product.findOne({ _id: productId });

    // Toggle the visibility status
    productDetails.is_blocked = !productDetails.is_blocked;

    // Update the visibility status in the database
    await productDetails.save();

    // Send the response indicating the visibility status
    res.json({ isVisible: !productDetails.is_blocked });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "An error occurred" });
  }
};


const editProductload = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(productId);

    console.log('319 - admincontrller its teh produc ')
    const productData = await Product.findOne({ _id: productId });
    console.log(productData)

    res.render("admin/productEditForm", { productData });
  } catch (error) {
    console.log(error.message);
  }
};

//to edit product from the admin's product edit form



const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { productName, productPrice, productDescription, productCategory } =
      req.body;

    // Retrieve the existing product
    const existingProduct = await Product.findById(productId);

    // Handle image changes
    let updatedImages = existingProduct.image;
    if (req.files && req.files.length > 0) {
      // Process and resize the new images
      const newImages = req.files.map((file) => {
        const newPath = `${file.path}.png`;
        fs.renameSync(file.path, newPath);
        sharp(newPath).resize(800, 600).toFile(newPath); // Resize the image
        return newPath.replace(/public/gi, "");
      });

      updatedImages = [...newImages]; // Use only the new images when files are uploaded
    }

    // Check if no new files are uploaded
    if (!req.files || req.files.length === 0) {
      updatedImages = existingProduct.image; // Retain the existing images
    }

    // Update the product
    const updatedProduct = {
      name: productName,
      price: productPrice,
      description: productDescription,
      category: productCategory,
      image: updatedImages,
    };

    const newProduct = await Product.findByIdAndUpdate(
      productId,
      updatedProduct,
      { new: true }
    );
    console.log("newProduct:", newProduct);

    res.redirect("/admin/product");
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately
  }
};

const getOrderDetails = async(req,res)=>{
  try {
    
    const orders = await Order.find()



    res.render('admin/allOrders', {orders})
  } catch (error) {
    
  }
}


module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  adminLogout,
  usersListLoad,
  blockUser,
  unblockUser,
  showCategoryTable,
  addCategory,
  ProductPageLoad,
  addProduct,
  hideCategory,
  unhideCategory,
  // hideProduct,
  // displayProduct,
  editProductload,
  editProduct,
  getOrderDetails,
  hideUnhideProduct,
  productsDisplay,
};
