//========================================================================================================================================

const userHelpers = require("../helpers/userHelpers");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");

const addToCart = async (req, res) => {
  try {
    const productId = req.body.productId;

    console.log(productId);
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      // Handle the case when productId is not a valid ObjectId
      // Return an error response or perform appropriate actions
      console.log("error");
      // ...
    }
    const userId = req.session.user_id;

    // Find the cart for the user
    let cart = await Cart.findOne({ user_id: userId });

    // If there is no cart, create a new one for the user
    if (!cart) {
      cart = new Cart({ user_id: userId, products: [] });
    }

    // Check if the product is already in the cart
    const existingProductIndex = cart.products.findIndex((product) =>
      product.productId.equals(productId)
    );

    console.log("entereing here");

    if (existingProductIndex !== -1) {
      // If it's already there, update the quantity
      const product = await Product.findById(productId);

      console.log("---------------------------------------");

      const productStock = product.stockQuantity;
      const cartProductQuantity =
        cart.products[existingProductIndex].quantity + 1;

      console.log("product stock", productStock);

      console.log("cart stock", cartProductQuantity);

      console.log("---------------------------------------");

      if (cartProductQuantity > productStock) {
        return res.status(400).json({ message: "Cart out of stock" });
      }

      cart.products[existingProductIndex].quantity += 1;

      // Calculate and assign the total value for the updated product
      cart.products[existingProductIndex].total =
        cart.products[existingProductIndex].price *
        cart.products[existingProductIndex].quantity;
    } else {
      // If not there, add it
      const newProduct = await Product.findById(productId);
      console.log("product price", newProduct.price);

      const productStock = newProduct.stockQuantity;
      const cartStock = 1;

      console.log('--------------------------------------------------stockproduct')
      console.log(productStock)
      console.log('--------------------------------------------------stockproduct')

      if(cartStock > productStock){
        return res.status(400).json({message : "Cart out of stock"})
      }

      cart.products.push({
        productId,
        quantity: 1,
        price: newProduct.price,
        total: newProduct.price,
      });
    }

    // Calculate and assign the total value for each product
    cart.products.forEach((product) => {
      product.total = product.price * product.quantity;
    });

    // Calculate the total for the cart
    cart.total = cart.products.reduce((total, product) => {
      return total + product.total;
    }, 0);

    console.log(cart.total);
    // Save the updated cart to the database
    const updatedCart = await cart.save();
    console.log("updatedCart: ", updatedCart);

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    // Handle the error and send an appropriate response
    // ...
  }
};

const getCartPage = async (req, res) => {
  try {
    const userId = req.session.user_id;

    console.log(userId);

    const isUserLoggedIn = req.session.user_id !== undefined;

    const cartCheck = await Cart.findOne({ user_id: userId });

    console.log("cartCheck found==================", cartCheck);

    if (cartCheck) {
      //populate the feilds from the product
      const cart = await Cart.findOne({ user_id: req.session.user_id })
        .populate({
          path: "products.productId",
          populate: { path: "category", select: "categoryOffer" },
        })
        .lean()
        .exec();

      console.log(
        cart,
        "cart is found after populating------------------------------------xxxx"
      );

      const products = cart.products.map((product) => {
        //total amount of all the products

        const total =
          Number(product.quantity) * Number(product.productId.price);

        //calculate the category and product offer

        const categoryOfferPercentage =
          product.productId.category.categoryOffer;
        const productOfferPercentage = product.productId.productOffer;

        const categoryDiscountAmount = (total * categoryOfferPercentage) / 100;

        const productDiscountAmount = (total * productOfferPercentage) / 100;

        const final = total - productDiscountAmount - categoryDiscountAmount;
        const finalAmount = Math.floor(final);
        const productStock = product.productId.stockQuantity;

        return {
          _id: product.productId._id.toString(),
          name: product.productId.name,
          categoryOffer: product.productId.category.categoryOffer, //access the category feild directly
          image: product.productId.image,
          price: product.productId.price,
          // description : product.productId.description
          finalAmount: finalAmount,
          discountAmount: categoryDiscountAmount + productDiscountAmount,
          productOffer: product.productId.productOffer,
          quantity: product.quantity,
          total: total,
          user_id: req.session.user_id,
          totalDiscountPercentage:
            productOfferPercentage + categoryOfferPercentage,
          stock: productStock,
        }
      });

      console.log("_____________________________________products");

      console.log(products);

      console.log(
        "________________________________________________________products End"
      );

      // finding the total value of all products in the cart

      const total = products.reduce((sum, product) => {
        return sum + Number(product.total);
      }, 0);

      console.log(
        "________________________________________________________total"
      );
      console.log(total);

      console.log(
        "________________________________________________________total End"
      );

      // calculating total product offer discount

      let totalProductDiscountAmount = 0;

      const productDiscounts = cart.products.forEach((item) => {
        const quantity = item.quantity;
        const price = item.productId.price;

        const productOffer = item.productId.productOffer;

        const discountAmount = (quantity * price * productOffer) / 100;
        totalProductDiscountAmount += discountAmount;
      });

      // calculating total category offer discount Amount

      let totalCategoryDiscountAmount = 0;

      const categoryDiscounts = cart.products.forEach((item) => {
        const actualProductAmount = item.productId.price * item.quantity;
        const categoryOffer = item.productId.category.categoryOffer;

        const categoryDiscountAmount =
          (actualProductAmount * categoryOffer) / 100;
        totalCategoryDiscountAmount += categoryDiscountAmount;
      });

      const TotalAmount = Math.floor(
        total - totalProductDiscountAmount - totalCategoryDiscountAmount
      );

      //get the total count of products
      const totalCount = products.length;

      res.render("users/cart", {
        isUserLoggedIn,
        products,
        total,
        totalCount,
        subtotal: total,
        TotalAmount,
      });
    } else {
      const isUserLoggedIn = req.session.user_id !== undefined;

      res.render("users/cart", {
        isUserLoggedIn,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateQuantity = async (req, res) => {
  const productId = req.body.productId;
  const quantity = req.body.quantity;
  const userId = req.session.user_id;

  console.log(
    "entered into the updateQuantity-----------------------------------------------------xxxxxxxxxxxxxxxxxxx"
  );

  console.log("increase success");

  //find the cart for the user

  let cart = await Cart.findOne({ user_id: userId });
  const productInCart = await Product.findOne({ _id: productId });

  let stockQuantityMain = productInCart.stockQuantity;
  console.log(stockQuantityMain);

  if (!cart) {
    //termporary error message
    // res.status(404).json({ message: "Cart not found" });

    return res.render("users/cartnotFounderror");
  }

  //find the product in the cart's product array

  if (stockQuantityMain > quantity) {
    const product = cart.products.find((product) => {
      return product.productId.toString() === productId;
    });

    console.log("product is", product);
    if (!product) {
      // If the product is not found in the cart, handle the error or return an appropriate response
      return res.status(404).json({ message: "Product not found in cart" });
    }

    //update product quantity and total
    let stock = product.stockQuantity;
    product.quantity = quantity;
    product.total = product.price * quantity;
    product.stockQuantity -= 1;

    stock = product.stockQuantity;
    console.log(stock);

    cart.total = cart.products.reduce((total, product) => {
      return total + product.total;
    }, 0);

    console.log("cart.total is ==", cart.total);
    //save the updated cart to the database
    const updatedCart = await cart.save();

    res.json({ cart: updatedCart, error: false });
  } else {
    console.log("------------------------------exceed");
    res.json({ error: true });
  }
};

const updateQuantityDecrease = async (req, res) => {
  const productId = req.body.productId;
  const quantity = req.body.quantity;
  const userId = req.session.user_id;
  console.log("decrease success");

  //find the cart for the user

  let cart = await Cart.findOne({ user_id: userId });

  console.log("cart ==========", cart);

  if (!cart) {
    //termporary error message
    //return res.status(404).json({ message: "Cart not found" });
    return res.render("users/cartnotFounderror");
  }

  //find the product in the cart's product array

  console.log("cart products =", cart.products);

  const product = cart.products.find((product) => {
    return product.productId.toString() === productId;
  });

  console.log("product is", product);
  if (!product) {
    // If the product is not found in the cart, handle the error or return an appropriate response
    return res.status(404).json({ message: "Product not found in cart" });
  }

  //update product quantity and total

  product.quantity = quantity;
  product.total = product.price * quantity;

  console.log("product total===============", product.total);

  cart.total = cart.products.reduce((total, product) => {
    return total + product.total;
  }, 0);

  console.log("cart.total is ==", cart.total);
  //save the updated cart to the database
  const updatedCart = await cart.save();
  console.log("------------------------------------------253");
  console.log(updatedCart);

  res.json({ cart: updatedCart });
};

const deleteFromCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.session.user_id;

    console.log(
      "------------------------------------------***********************253"
    );

    console.log("entered into the detete form cart");

    console.log(
      "------------------------------------------*************************253"
    );

    let cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      // return res.status(404).json({ message: "cart is not found" });
      return res.render("users/cartnotFounderror");
    }

    //now that we found the cart for the user , extract the product index in the cart's products array

    const productIndex = cart.products.findIndex(
      (product) => product.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found" });
    }

    //remove the product from the cart's product array
    cart.products.splice(productIndex, 1);

    //recalculate the cart's total
    cart.total = cart.products.reduce((total, product) => {
      return total + product.total;
    }, 0);

    //save the updated cart from the database

    const updatedCart = await cart.save();

    res.json({ cart: updatedCart });
  } catch (error) {
    console.log(error.message);
  }
};

const changeQuantity = async (req, res) => {
  try {
    const response = await userHelpers.changeProductQuantity(req, res);

    res.send(response);
  } catch (error) {
    console.log(error.message);
  }
};

const successPage = async (req, res) => {
  try {
    res.render("users/orderSuccesspage");
  } catch (error) {}
};

module.exports = {
  addToCart,
  getCartPage,
  updateQuantity,
  deleteFromCart,
  updateQuantityDecrease,
  changeQuantity,
};
