// const Cart = require("../models/cartModel");
// const Product = require("../models/productModel");
// const mongoose = require("mongoose");

// const addToCart = async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       // Handle the case when productId is not a valid ObjectId
//       // Return an error response or perform appropriate actions
//       console.log("error");
//       // ...
//     }
//     const userId = req.session.user_id;

//     // Find the cart for the user
//     let cart = await Cart.findOne({ user_id: userId });

//     // If there is no cart, create a new one for the user
//     if (!cart) {
//       cart = new Cart({ user_id: userId, products: [] });
//     }

//     // Check if the product is already in the cart
//     const existingProductIndex = cart.products.findIndex((product) =>
//       product.productId.equals(productId)
//     );

//     if (existingProductIndex !== -1) {
//       // If it's already there, update the quantity
//       cart.products[existingProductIndex].quantity += 1;

//       // Calculate and assign the total value for the updated product
//       cart.products[existingProductIndex].total =
//         cart.products[existingProductIndex].price *
//         cart.products[existingProductIndex].quantity;
//     } else {
//       // If not there, add it
//       const newProduct = await Product.findById(productId);
//       console.log("product price", newProduct.price);
//       cart.products.push({
//         productId,
//         quantity: 1,
//         price: newProduct.price,
//         total: newProduct.price,
//       });
//     };

//     // Calculate and assign the total value for each product
//     cart.products.forEach((product) => {
//       product.total = product.price * product.quantity;
//     });

//     // Calculate the total for the cart
//     cart.total = cart.products.reduce((total, product) => {
//       return total + product.total;
//     }, 0);

//     // Save the updated cart to the database
//     const updatedCart = await cart.save();
//     console.log("updatedCart: ", updatedCart);

//     res.status(200).json({ message: "Product added to cart successfully" });
//   } catch (error) {
//     console.log(error.message);
//     // Handle the error and send an appropriate response
//     // ...
//   }
// };

// module.exports = {
//   addToCart,
// };






//========================================================================================================================================

const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");

const addToCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    console.log(productId)
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

    if (existingProductIndex !== -1) {
      // If it's already there, update the quantity
      cart.products[existingProductIndex].quantity += 1;

      // Calculate and assign the total value for the updated product
      cart.products[existingProductIndex].total =
        cart.products[existingProductIndex].price *
        cart.products[existingProductIndex].quantity;
    } else {
      // If not there, add it
      const newProduct = await Product.findById(productId);
      console.log("product price", newProduct.price);
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


    res.json({status : true})
  } catch (error) {
    console.log(error.message);
    // Handle the error and send an appropriate response
    // ...
  }
};



const getCartPage = async(req,res)=>{
      try {
        const userId = req.session.user_id;
        

         let cart = await Cart.findOne({user_id : userId}).lean();
        //check if the cart exists if it doesn't create an empty cart object
        if(!cart){
          cart = { products : []};
        } else { 
          //fetch the product details for each cart item
           const productIds =  cart.products.map((product)=> product.productId);
           const products = await Product.find({_id : {$in : productIds}}).lean();

           //Map product details to cart items


              cart.products.forEach((product) => {
        const matchingProduct = products.find(
          (p) => p._id.toString() === product.productId.toString()
        );
              
           if (matchingProduct) {
             product.name = matchingProduct.name;
             product.image = matchingProduct.image[0];
             product.price = matchingProduct.price;


           }
           });  

          }

          const isUserLoggedIn = req.session.user_id !== undefined;
          const isGuest = !isUserLoggedIn;



        res.render('users/cart.hbs',{cart,isUserLoggedIn,isGuest});
      } catch (error) {
        console.log(error.message);
      }
}

const updateQuantity = async(req,res)=>{
  const productId = req.body.productId;
  const quantity = req.body.quantity;
  const userId = req.session.user_id;

console.log('increase success');
  
  //find the cart for the user

 let cart = await Cart.findOne({user_id : userId});
 const productInCart = await Product.findOne({_id : productId });
 

let stockQuantityMain = productInCart.stockQuantity;
console.log(stockQuantityMain);

 
 
 if(!cart){

  //termporary error message
        // res.status(404).json({ message: "Cart not found" });

          return res.render("users/cartnotFounderror");


 }


//find the product in the cart's product array

if(stockQuantityMain>=quantity){


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


res.json({ cart: updatedCart, error:false });




}else{
  console.log('------------------------------exceed')
  res.json({ error:true });
  
}





}


const updateQuantityDecrease = async (req, res) => {
  const productId = req.body.productId;
  const quantity = req.body.quantity;
  const userId = req.session.user_id;
 console.log('decrease success')
 
  //find the cart for the user

  let cart = await Cart.findOne({ user_id: userId });

  console.log("cart ==========", cart);

  if (!cart) {
    //termporary error message
    return res.status(404).json({ message: "Cart not found" });
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


const deleteFromCart = async(req,res)=>{
  try {
    const productId = req.body.productId;
    const userId = req.session.user_id;

    let cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      return res.status(404).json({ message: "cart is not found" });
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
    console.log(error.message)
  }
}






const successPage =async(req,res)=>{
  try {
    res.render('users/orderSuccesspage');
  } catch (error) {
    
  }
}
    

module.exports = {
  addToCart,
  getCartPage,
  updateQuantity,
  deleteFromCart,
  updateQuantityDecrease,
};

