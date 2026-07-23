const { dbMock } = require('../config/db');

// Get Products with Deep Filters
const getProducts = (req, res) => {
  let list = dbMock.products;
  const { category, country, grape, search } = req.query;

  if (category) list = list.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  if (country) list = list.filter(p => p.country_of_origin.toLowerCase().includes(country.toLowerCase()));
  if (grape) list = list.filter(p => p.grape_variety.toLowerCase().includes(grape.toLowerCase()));
  if (search) list = list.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()));

  res.json({ success: true, count: list.length, data: list });
};

// Get Product Detail by ID
const getProductById = (req, res) => {
  const prod = dbMock.products.find(p => p.product_id === parseInt(req.params.id));
  if (!prod) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
  res.json({ success: true, data: prod });
};

module.exports = {
  getProducts,
  getProductById
};
