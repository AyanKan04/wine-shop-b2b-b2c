const { dbMock, persistProduct } = require('../config/db');

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

// Create new product with tier pricing
const createProduct = async (req, res) => {
  const { product_name, sku, category, country_of_origin, region, grape_variety, vintage_year, alcohol_content, volume_ml, moq, image_url, description, tier_prices } = req.body;

  if (!product_name || !sku) {
    return res.status(400).json({ success: false, message: 'Tên sản phẩm và SKU là bắt buộc' });
  }

  // Check duplicate SKU
  if (dbMock.products.find(p => p.sku === sku)) {
    return res.status(400).json({ success: false, message: `SKU "${sku}" đã tồn tại trong hệ thống` });
  }

  const newProduct = {
    product_id: Math.max(...dbMock.products.map(p => p.product_id)) + 1,
    sku,
    product_name,
    category: category || 'Fine Wine',
    country_of_origin: country_of_origin || 'France',
    region: region || '',
    grape_variety: grape_variety || '',
    vintage_year: parseInt(vintage_year) || new Date().getFullYear(),
    alcohol_content: parseFloat(alcohol_content) || 13.0,
    volume_ml: parseInt(volume_ml) || 750,
    moq: parseInt(moq) || 5,
    image_url: image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    description: description || '',
    tier_prices: tier_prices || [
      { tier_level: 1, min_quantity: parseInt(moq) || 5, price_per_unit: 50000000 },
      { tier_level: 2, min_quantity: 20, price_per_unit: 45000000 },
      { tier_level: 3, min_quantity: 50, price_per_unit: 40000000 },
      { tier_level: 4, min_quantity: 100, price_per_unit: 36000000 },
      { tier_level: 5, min_quantity: 200, price_per_unit: 32000000 }
    ]
  };

  dbMock.products.push(newProduct);

  // Persist product and tier prices to SQL Server
  await persistProduct(newProduct);

  // Also add to inventory
  dbMock.inventory.push({
    product_id: newProduct.product_id,
    sku: newProduct.sku,
    product_name: newProduct.product_name,
    stock_on_hand: 0,
    reserved: 0,
    min_stock_level: 10,
    location: 'Kho A1 - Quận 7'
  });

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Sales',
    action: `Thêm sản phẩm mới: ${newProduct.product_name} (${newProduct.sku})`,
    actor: 'Sales Manager',
    icon: 'fa-plus',
    color: '#D4AF37'
  });

  res.status(201).json({ success: true, message: `Đã thêm sản phẩm "${newProduct.product_name}" thành công!`, data: newProduct });
};

// Update existing product
const updateProduct = (req, res) => {
  const product = dbMock.products.find(p => p.product_id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
  }

  const updates = req.body;
  Object.keys(updates).forEach(key => {
    if (key !== 'product_id') {
      product[key] = updates[key];
    }
  });

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Sales',
    action: `Cập nhật sản phẩm: ${product.product_name}`,
    actor: 'Sales Manager',
    icon: 'fa-pen',
    color: '#D4AF37'
  });

  res.json({ success: true, message: `Đã cập nhật sản phẩm "${product.product_name}"!`, data: product });
};

// Delete product
const deleteProduct = (req, res) => {
  const index = dbMock.products.findIndex(p => p.product_id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
  }

  const removed = dbMock.products.splice(index, 1)[0];

  // Also remove from inventory
  const invIndex = dbMock.inventory.findIndex(i => i.product_id === removed.product_id);
  if (invIndex !== -1) dbMock.inventory.splice(invIndex, 1);

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Sales',
    action: `Xóa sản phẩm: ${removed.product_name} (${removed.sku})`,
    actor: 'Sales Manager',
    icon: 'fa-trash',
    color: '#EF4444'
  });

  res.json({ success: true, message: `Đã xóa sản phẩm "${removed.product_name}"` });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
