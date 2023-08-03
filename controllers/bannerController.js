const mongoose = require("mongoose");
const Banner = require("../models/bannerModel");
const path = require("path");
const { ObjectId } = require("mongoose");

const getBannerPageLoad = async (req, res) => {
  const banners = await Banner.find();

  res.render("admin/bannerPageAdmin", { banners });
};

const bannerDetailsAdd = async (req, res) => {
  const name = req.body.bannerName;
  const file = req.file;


  const filepath = file.path;
  const relativePath = path.relative("public", filepath);

  const banner = new Banner({
    title: name,
    image: relativePath,
  });

  await banner.save();

  console.log(
    banner,
    "here is the banner ------------------------------.-------------------"
  );

  res.redirect("add-banner");
};



const listUnlistBanner = async (req, res) => {
  const bannerId = req.params.id;
  console.log("--------------------------------------------");
  console.log(bannerId);

  const updatedBanner = await Banner.findOne({ _id: bannerId });
  if (updatedBanner.is_hide === true) {
    updatedBanner.is_hide = false;
  } else {
    updatedBanner.is_hide = true;
  }
  await updatedBanner.save();
  console.log(updatedBanner);
  res.redirect("/admin/add-banner");
};

module.exports = {
  getBannerPageLoad,
  bannerDetailsAdd,
  listUnlistBanner,
};
