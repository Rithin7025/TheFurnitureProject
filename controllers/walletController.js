const Wallet = require('../models/walletModel')
const userHelpers = require('../helpers/userHelpers')




const walletOrder = async (req, res) => {
  try {

    console.log('entered into the walletOrder---------')

    console.log("wallet order controller");
    const orderId = req.query.id;
    const userId = req.session.user_id;
    const updatewallet = await userHelpers.updatewallet(userId, orderId);
    console.log(updatewallet, "updated wallet data");

    res.redirect("/orderPlaced");


  } catch (error) {}
};


const loadWallet = async (req, res) => {
  try {

    const isUserLoggedIn = req.session.user_id !== undefined
    
    const userId = req.session.user_id;
    const walletDetails = await userHelpers.getWalletDetails(userId);
    const creditOrderDetails = await userHelpers.creditOrderDetails(userId);
    const debitOrderDetails = await userHelpers.debitOrderDetails(userId);

    // Merge credit and debit order details into a single array
    const orderDetails = [...creditOrderDetails, ...debitOrderDetails];

    // Sort the merged order details by date and time in descending order
    orderDetails.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination logic
    const currentPage = parseInt(req.query.page) || 1;
    const PAGE_SIZE = 5;

    const totalItems = orderDetails.length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedOrderDetails = orderDetails.slice(startIndex, endIndex);

    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push({
        number: i,
        current: i === currentPage,
      });
    }

    res.render("users/wallet", {
      walletDetails,
      orderDetails: paginatedOrderDetails,
      showPagination: totalItems > PAGE_SIZE,
      hasPrev,
      prevPage: currentPage - 1,
      hasNext,
      nextPage: currentPage + 1,
      pages,
      isUserLoggedIn,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};




module.exports = {
  walletOrder,
  loadWallet,
};