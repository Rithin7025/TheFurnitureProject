const User = require('../models/userModel');
const Product = require('../models/productModel');
const sharp = require('sharp');
const Category = require('../models/categoryModel');
const fs = require('fs');
const path = require('path');



const showCategoryTable = async (req, res) => {
  try {
    const category = await Category.find();

    res.render("admin/category", { category });
  } catch (error) {
    console.log(error.message);
  }
};


const addCategory = async (req, res) => {
  try {
    const name = req.body.categoryName;
    const file = req.file;
    const offer = req.body.categoryOffer;

    if (!name) {
      return res.status(400).send("Category name is required.");
    }

    if (!file) {
      return res.status(400).send("Category image is required.");
    }

    const filepath = file.path;
    const relativePath = path.relative("public", filepath);

    console.log("Category Name:", name);
    console.log("Category Image Path:", relativePath);
    console.log("Category Offer:", offer);

    const category = new Category({
      categoryName: name,
      image: relativePath,
      categoryOffer: Number(offer),
    });

    await category.save();
    console.log("Category saved successfully.");

    res.render("admin/category-success");
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).send("An error occurred while saving the category.");
  }
};




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


const editCategoryload = async(req,res)=>{


 try {
   const Id = req.params.id;
   console.log(Id)
   
   const categoryData = await Category.findById({_id:Id})
   
   console.log("entered into the edit category");
   
   

   console.log('before extracting from the page')
   const name = categoryData.categoryName;
   const image = categoryData.image;
   const offer = categoryData.categoryOffer;
   const categoryId = categoryData._id;
   


   console.log(name, image, offer,Id);


   res.render("admin/categoryEditFormLoad",{name,image,offer,Id});

  
 } catch (error) {
  console.log(error)
 }

 
}

const editCategory = async(req,res)=>{
  try {

    const Id = req.params.id;
 
    console.log('entered into the edit category');

    const {categoryName} = req.body;
    const offer = req.body.categoryOffer

    console.log(categoryName,offer);

    const updateCategory = {
      
      categoryName : categoryName,
      categoryOffer : offer

    }

    const updatedCategory = await Category.findByIdAndUpdate(
      {_id : Id},updateCategory,
      {new: true}
    )

    console.log('updated category =',updatedCategory);

    res.redirect("/admin/category");


 

  } catch (error) {
    console.log(error)
  }
}



 

module.exports = {
  
  showCategoryTable,
  addCategory,
  hideCategory,
  unhideCategory,
  editCategoryload,
  editCategory
};