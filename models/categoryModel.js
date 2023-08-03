const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    unique: true, // Add unique index
  },
  image: {
    type: String,
    required: true,
  },
  is_hide: {
    type: Boolean,
    default: false,
  },
  categoryOffer: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Category", categorySchema);
