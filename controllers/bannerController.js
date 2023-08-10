const mongoose = require("mongoose")
const Banner = require("../models/bannerModel")
const path = require("path")
const { ObjectId } = require("mongoose")

const getBannerPageLoad = async (req, res) => {
  const banners = await Banner.find()

  res.render("admin/bannerPageAdmin", { banners })
}

const bannerDetailsAdd = async (req, res) => {
  const name = req.body.bannerName
  const file = req.file

  const filepath = file.path
  const relativePath = path.relative("public", filepath)

  const banner = new Banner({
    title: name,
    image: relativePath,
  })

  await banner.save()

  console.log(
    banner,
    "here is the banner ------------------------------.-------------------"
  )

  res.redirect("add-banner")
}

const listUnlistBanner = async (req, res) => {
  const bannerId = req.params.id
  console.log("--------------------------------------------")
  console.log(bannerId)

  const updatedBanner = await Banner.findOne({ _id: bannerId })
  if (updatedBanner.is_hide === true) {
    console.log("entered into true")
    updatedBanner.is_hide = false
  } else {
    console.log("entered into false")
    updatedBanner.is_hide = true
  }
  await updatedBanner.save()
  console.log(updatedBanner)

  res.redirect("/admin/add-banner")
}

const editBannerLoad = async (req, res) => {
  const Id = req.params.id

  const bannerData = await Banner.findById({ _id: Id })

  const title = bannerData.title
  const image = bannerData.image

  res.render("admin/bannerEditFormLoad", { title, image, Id })
}

const editBanner = async (req, res) => {
  console.log("enterd into the edit")

  const Id = req.params.id

  const bannerTitle = req.body.bannerTitle
}

module.exports = {
  getBannerPageLoad,
  bannerDetailsAdd,
  listUnlistBanner,
  editBannerLoad,
  editBanner,
}
