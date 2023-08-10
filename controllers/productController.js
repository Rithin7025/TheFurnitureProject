const Product = require("../models/productModel")
const sharp = require("sharp")
const Order = require("../models/orderModel")

const Category = require("../models/categoryModel")
const fs = require("fs")

const moment = require("moment-timezone")
const { ObjectId } = require("mongodb")

//=============================================================================================================//

// for rendering product page
const ProductPageLoad = async (req, res) => {
  try {
    const updatedProducts = await Product.find().lean()

    //creating a lookup object for creating categoryNames
    const categoryLookup = {}

    const categories = await Category.find({ is_hide: false }).lean()

    categories.forEach((category) => {
      categoryLookup[category._id] = category.categoryName
    })

    console.log(categories, "Have a good look in the categories")

    const products = updatedProducts.map((product) => ({
      ...product,
      category: categoryLookup[product.category],
    }))

    console.log("----------------------------------------------------")
    console.log(products)
    console.log("----------------------------------------------------")

    res.render("admin/productpage", {
      products: products,
      categories: categories,
    })
  } catch (error) {
    console.log(error.message)
  }
}

//================================================================add product=============================================//

const addProduct = async (req, res) => {
  try {
    const {
      productName: name,
      productPrice: price,
      productDescription: description,
      category: categoryy,
      productStock,
      productDiscount,
    } = req.body
    console.log("--------------------------------------------------xxxxxxx")

    console.log(
      req.body,
      "Here is the req.body--------------------------------------------------xxxxxxx"
    )

    console.log("--------------------------------------------------xxxxxxx")

    const photos = req.files.map((file) => {
      const oldPath = file.path
      const newPath = `${file.path}.png`
      fs.renameSync(oldPath, newPath)
      return newPath.replace(/public/gi, "").replace(/\\/g, "/")
    })

    // Resize the images using Sharp
    for (const photo of photos) {
      await sharp(`public/${photo}`)
        .resize(800, 800)
        .toBuffer((err, buffer) => {
          if (err) throw err
          try {
            fs.writeFileSync(`public/${photo}`, buffer)
          } catch (error) {
            console.error("Error writing file:", error)
          }
        })
    }

    console.log("arrived here after the getting the photos")

    const discountPrice = Math.floor((price * (100 - productDiscount)) / 100)

    const product = new Product({
      name: name,
      price: price,
      image: photos,
      description: description,
      category: categoryy,
      stockQuantity: productStock,
      productOffer: productDiscount,
      discountedPrice: discountPrice,
    })

    console.log("as - New product with stock==", product)

    await product.save()

    res.render("admin/product-success.hbs")
  } catch (error) {
    console.log(error.message)
    // Handle the error appropriately
  }
}

const editProductload = async (req, res) => {
  try {
    const productId = req.params.id
    console.log(productId)

    const productData = await Product.findOne({ _id: productId })

    res.render("admin/productEditForm", { productData })
  } catch (error) {
    console.log(error.message)
  }
}

//to edit product from the admin's product edit form

const editProduct = async (req, res) => {
  try {
    const productId = req.params.id
    const {
      productName,
      productPrice,
      productDescription,
      productCategory,
      productStock,
      productDiscount,
    } = req.body

    // Retrieve the existing product
    const existingProduct = await Product.findById(productId)

    // Handle image changes
    let updatedImages = existingProduct.image
    if (req.files && req.files.length > 0) {
      // Process and resize the new images
      const newImages = req.files.map((file) => {
        const newPath = `${file.path}.png`
        fs.renameSync(file.path, newPath)
        sharp(newPath).resize(800, 600).toFile(newPath) // Resize the image
        return newPath.replace(/public/gi, "")
      })

      updatedImages = [...newImages] // Use only the new images when files are uploaded
    }

    // Check if no new files are uploaded
    if (!req.files || req.files.length === 0) {
      updatedImages = existingProduct.image // Retain the existing images
    }

    const discountPrice = (productPrice * (100 - productDiscount)) / 100

    // Update the product
    const updatedProduct = {
      name: productName,
      price: productPrice,
      description: productDescription,
      category: productCategory,
      image: updatedImages,
      stockQuantity: productStock,

      productOffer: productDiscount,
      discountedPrice: discountPrice,
    }

    const newProduct = await Product.findByIdAndUpdate(
      productId,
      updatedProduct,
      { new: true }
    )
    console.log("newProduct:", newProduct)

    res.redirect("/admin/product")
  } catch (error) {
    console.log(error.message)
    // Handle the error appropriately
  }
}

module.exports = {
  ProductPageLoad,
  addProduct,
  editProductload,
  editProduct,
}
