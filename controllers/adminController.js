const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const Product = require("../models/productModel")
const sharp = require("sharp")
const Order = require("../models/orderModel")
const adminHelpers = require("../helpers/adminHelpers")
const Wallet = require("../models/walletModel")
const XLSX = require('xlsx');


const Category = require("../models/categoryModel")
const fs = require("fs")

const path = require("path")
const moment = require("moment-timezone")
const { ObjectId } = require("mongodb")
const { Types } = require("mongoose")

//for rendering admin login page
const loadLogin = async (req, res) => {
  try {
    res.render("admin/login")
  } catch (error) {
    console.log(error.message)
  }
}

//for verifying the admin is true or not
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password

    const userData = await User.findOne({ email: email })
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("admin/login", {
            message: "password and email incorrect",
          })
        } else {
          req.session.admin_id = userData._id
          res.redirect("/admin/home")
        }
      } else {
        res.render("admin/login", { message: "password and email incorrect" })
      }
    } else {
      res.render("admin/login", { message: "Email and password incorrect" })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadDashboard = async (req, res) => {
  try {
    User.findById({ _id: req.session.user_id })
    const dashBoardDetails = await adminHelpers.loadingDashboard(req, res)

    console.log(dashBoardDetails, "got dashboard details")

    const orderDetails = await adminHelpers.OrdersList(req, res)

    const totalUser = dashBoardDetails.totaluser
    const totalSales = dashBoardDetails.totalSales
    const salesbymonth = dashBoardDetails.salesbymonth
    const paymentMethod = dashBoardDetails.paymentMethod
    const yearSales = dashBoardDetails.yearSales
    const todaySales = dashBoardDetails.todaySales
    // console.log(todaySales,'todaySales');
    // console.log(totalUser,'totalUser');
    // console.log(totalSales,'totalSales');

    console.log(paymentMethod, "paymentMethod")
    // console.log(yearSales,'yearSales');
    let sales = encodeURIComponent(JSON.stringify(salesbymonth))

    console.log(sales, "sales")

    res.render("admin/home", {
      totalUser,
      todaySales: todaySales[0],
      totalSales: totalSales[0],
      salesbymonth: encodeURIComponent(JSON.stringify(salesbymonth)),
      paymentMethod: encodeURIComponent(JSON.stringify(paymentMethod)),
      yearSales: yearSales[0],
      orderDetails: orderDetails,
    })
  } catch (error) {
    console.log(error.message)
  }
}

const adminLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect("/admin")
  } catch (error) {
    console.log(error.message)
  }
}
//for loading the users in db
const usersListLoad = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: 0 })

    res.render("admin/usersList", { users: usersData })
  } catch (error) {
    console.log(error.message)
  }
}

const blockUser = async (req, res) => {
  try {
    const user_id = req.params.id
    console.log(user_id)
    const is_blocked = await User.findByIdAndUpdate(user_id, {
      $set: { is_blocked: true },
    })
    console.log(is_blocked)
    res.redirect("/admin/usersList")
    console.log("user blocked")
  } catch (error) {}
}

const unblockUser = async (req, res) => {
  try {
    const user_id = req.params.id
    console.log(user_id)
    const is_blocked = await User.findByIdAndUpdate(user_id, {
      $set: { is_blocked: false },
    })
    console.log(is_blocked)
    res.redirect("/admin/usersList")
    console.log("user unblocked")
  } catch (error) {}
}

//Product API
async function productsDisplay(req, res) {
  try {
    const products = await Product.find()
    res.json({ prs: products })
  } catch (err) {
    console.log(err)
  }
}

//hide unhide in a single button==========================================================
const hideUnhideProduct = async (req, res) => {
  try {
    const productId = req.params.id
    console.log("aC 333", productId)
    const productDetails = await Product.findOne({ _id: productId })

    // Toggle the visibility status
    productDetails.is_blocked = !productDetails.is_blocked

    // Update the visibility status in the database
    await productDetails.save()

    // Send the response indicating the visibility status
    res.json({ isVisible: !productDetails.is_blocked })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "An error occurred" })
  }
}

const loadSalesPage = async (req, res) => {
  try {
    const orderSuccessDetails = await adminHelpers.orderSuccess()

    console.log(orderSuccessDetails)

    console.log(
      "------------------------------------------------------------------------------****"
    )

    res.render("admin/adminSalesLoadPage", {
      order: orderSuccessDetails.orderHistory,
      total: orderSuccessDetails.total,
    })
  } catch (error) {
    console.log(error)
  }
}

const getSalesToday = async (req, res) => {
  try {
    const todaySales = await adminHelpers.salesToday()
    // console.log(todaySales,'todaySales');
    res.render("admin/adminSalesLoadPage", {
      order: todaySales.orderHistory,
      total: todaySales.total,
    })
  } catch (error) {
    console.log(error.message)
  }
}

const getWeekSales = async (req, res) => {
  try {
    const weeklySales = await adminHelpers.weeklySales()

    res.render("admin/adminSalesLoadPage", {
      order: weeklySales.orderHistory,
      total: weeklySales.total,
    })
  } catch (error) {
    console.log(error.message)
  }
}

const getMonthSales = async (req, res) => {
  try {
    const montlySales = await adminHelpers.monthlySales()

    res.render("admin/adminSalesLoadPage", {
      order: montlySales.orderHistory,
      total: montlySales.total,
    })
  } catch (error) {
    console.log(error.message)
  }
}
const getYearlySales = async (req, res) => {
  try {
    const yearlySales = await adminHelpers.yearlySales()
    res.render("admin/adminSalesLoadPage", {
      order: yearlySales.orderHistory,
      total: yearlySales.total,
    })
  } catch (error) {
    console.log(error.message)
  }
}

const salesWithDate = async (req, res) => {
  try {
    const salesWithDate = await adminHelpers.salesWithDate(req, res)
    res.render("admin/adminSalesLoadPage", {
      order: salesWithDate.orderHistory,
      total: salesWithDate.total,
    })
  } catch (error) {
    console.log(error.message, "salesWithDate controller error")
  }
}

// const downloadSalesReport = async (req, res) => {};


function formatDateToIst(date){
  return new Date(date).toLocaleString('en-IN',{
    timeZone : 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const downloadSalesReportExcel = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["Placed", "Delivered", "shipped"] },
    })
      .populate("user_id")
      .exec()

    const dateOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }

    const data = [["Index", "Date", "User", "Status", "Method", "Amount"]]

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const formattedDate = formatDateToIst(order.date)
      data.push([
        (i + 1).toString(),
        formattedDate,
        order.user_id.name,
        order.status,
        order.paymentMethod,
        order.totalprice,
      ])
    }

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "SalesReport")

    const buffer = XLSX.write(wb, { type: "buffer" })

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=SalesReport.xlsx"
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.send(buffer)
  } catch (error) {
    console.log(error.message, "something happened with the Excel download")
    res.status(500).json({ error: "Something went wrong" })
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
  hideUnhideProduct,
  productsDisplay,
  loadSalesPage,
  getSalesToday,
  getWeekSales,
  getMonthSales,
  getYearlySales,
  salesWithDate,
  downloadSalesReportExcel,
}
