const { getPool } = require('../config/db');

// Helper to map SQL Server PascalCase keys to Frontend camelCase/snake_case keys
const mapProductToFrontend = (prod) => {
  if (!prod) return null;
  
  let parsedTierPrices = [];
  if (prod.tier_prices) {
    parsedTierPrices = typeof prod.tier_prices === 'string' 
      ? JSON.parse(prod.tier_prices) 
      : prod.tier_prices;
  }

  const mappedTierPrices = parsedTierPrices.map(t => ({
    tier_level: t.TierLevel || t.tier_level,
    min_quantity: t.MinQuantity || t.min_quantity,
    price_per_unit: Number(t.PricePerUnit || t.price_per_unit || 0)
  }));

  return {
    product_id: Number(prod.ProductID || prod.product_id),
    sku: prod.SKU || prod.sku || '',
    product_name: prod.ProductName || prod.product_name || '',
    category: prod.Category || prod.category || '',
    country_of_origin: prod.CountryOfOrigin || prod.country_of_origin || '',
    region: prod.Region || prod.region || '',
    grape_variety: prod.GrapeVariety || prod.grape_variety || '',
    vintage_year: Number(prod.VintageYear || prod.vintage_year || 0),
    alcohol_content: Number(prod.AlcoholContent || prod.alcohol_content || 0),
    volume_ml: Number(prod.VolumeML || prod.volume_ml || 750),
    moq: Number(prod.MOQ || prod.moq || 1),
    image_url: prod.ImageURL || prod.image_url || '',
    description: prod.Description || prod.description || '',
    status: prod.Status || prod.status || 'ACTIVE',
    cost_price: Number(prod.CostPrice || prod.cost_price || 0),
    base_price: Number(prod.BasePrice || prod.base_price || (mappedTierPrices.length > 0 ? mappedTierPrices[0].price_per_unit : 0)),
    tier_prices: mappedTierPrices
  };
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, country, grape, search, priceStatus } = req.query;
    const pool = await getPool();
    
    let query = `
      SELECT p.*, c.category_name as category,
             pp.cost_price, pp.base_price,
             (SELECT json_agg(t.* ORDER BY t.tier_level ASC) FROM product_tier_prices t WHERE t.product_id = p.product_id) as tier_prices
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_prices pp ON pp.product_id = p.product_id
      WHERE p.status != 'DELETED'
    `;
    
    let params = [];
    let paramIndex = 1;

    if (category && category !== 'ALL') {
      query += ` AND c.category_name ILIKE $${paramIndex++}`;
      params.push(`%${category}%`);
    }
    if (country) {
      query += ` AND p.country_of_origin ILIKE $${paramIndex++}`;
      params.push(`%${country}%`);
    }
    if (grape) {
      query += ` AND p.grape_variety ILIKE $${paramIndex++}`;
      params.push(`%${grape}%`);
    }
    if (search) {
      query += ` AND (p.product_name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (priceStatus === 'PRICED') {
      query += ` AND (pp.base_price > 0 OR EXISTS (SELECT 1 FROM product_tier_prices WHERE product_id = p.product_id))`;
    }
    if (priceStatus === 'UNPRICED') {
      query += ` AND (pp.base_price IS NULL OR pp.base_price = 0) AND NOT EXISTS (SELECT 1 FROM product_tier_prices WHERE product_id = p.product_id)`;
    }

    const result = await pool.query(query, params);

    // Map database results to frontend format
    const products = result.rows.map(prod => mapProductToFrontend(prod));

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách sản phẩm' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT p.*, c.category_name as category,
             (SELECT json_agg(t.* ORDER BY t.tier_level ASC) FROM product_tier_prices t WHERE t.product_id = p.product_id) as tier_prices
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const prod = mapProductToFrontend(result.rows[0]);

    res.json({ success: true, data: prod });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải chi tiết sản phẩm' });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  const { 
    sku, product_name, category, country_of_origin, region, grape_variety, 
    vintage_year, alcohol_content, volume_ml, moq, image_url, description, tier_prices 
  } = req.body;

  try {
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(`
          INSERT INTO products (sku, product_name, category_id, country_of_origin, region, grape_variety, vintage_year, alcohol_content, volume_ml, moq, image_url, description)
          VALUES ($1, $2, (SELECT category_id FROM categories WHERE category_name = $3 LIMIT 1), $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING product_id
        `, [sku, product_name, category, country_of_origin, region, grape_variety, vintage_year, alcohol_content, volume_ml, moq, image_url, description]);

      const productId = result.rows[0].product_id;

      // Insert Tier Prices
      if (tier_prices && Array.isArray(tier_prices)) {
        for (const tier of tier_prices) {
          await client.query(`
              INSERT INTO product_tier_prices (product_id, tier_level, min_quantity, price_per_unit)
              VALUES ($1, $2, $3, $4)
            `, [productId, tier.tier_level, tier.min_quantity, tier.price_per_unit]);
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', product_id: productId });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm sản phẩm' });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const { 
    sku, product_name, category, country_of_origin, region, grape_variety, 
    vintage_year, alcohol_content, volume_ml, moq, image_url, description, tier_prices 
  } = req.body;

  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const companyId = req.user?.company_id || 0;
      let updateQuery = `
          UPDATE products SET 
            sku = $1, product_name = $2, category_id = (SELECT category_id FROM categories WHERE category_name = $3 LIMIT 1), 
            country_of_origin = $4, region = $5, grape_variety = $6, 
            vintage_year = $7, alcohol_content = $8, volume_ml = $9, 
            moq = $10, image_url = $11, description = $12
          WHERE product_id = $13 
        `;
      let params = [sku, product_name, category, country_of_origin, region, grape_variety, vintage_year, alcohol_content, volume_ml, moq, image_url, description, productId];
      
      if (req.user?.user_type === 'COMPANY_ADMIN') {
        updateQuery += ` AND seller_company_id = $14 `;
        params.push(companyId);
      }

      const updateResult = await client.query(updateQuery, params);

      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật sản phẩm này hoặc sản phẩm không tồn tại.' });
      }

      await client.query(`DELETE FROM product_tier_prices WHERE product_id = $1`, [productId]);

      if (tier_prices && Array.isArray(tier_prices)) {
        for (const tier of tier_prices) {
          await client.query(`
              INSERT INTO product_tier_prices (product_id, tier_level, min_quantity, price_per_unit)
              VALUES ($1, $2, $3, $4)
            `, [productId, tier.tier_level, tier.min_quantity, tier.price_per_unit]);
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Cập nhật sản phẩm & giá thành công' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật sản phẩm' });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Dọn dẹp các bảng con liên quan đến giá và tồn kho
      await client.query('DELETE FROM product_tier_prices WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM product_prices WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM contract_prices WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM customer_prices WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM inventories WHERE product_id = $1 AND reserved_quantity = 0', [productId]);

      // 2. Thử xóa cứng sản phẩm khỏi bảng Products
      const companyId = req.user?.company_id || 0;
      let delQuery = `DELETE FROM products WHERE product_id = $1`;
      let params = [productId];

      if (req.user?.user_type === 'COMPANY_ADMIN') {
        delQuery += ` AND seller_company_id = $2`;
        params.push(companyId);
      }
      
      const delResult = await client.query(delQuery, params);

      if (delResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Sản phẩm không tồn tại hoặc bạn không có quyền xóa.' });
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Đã xóa hoàn tất sản phẩm khỏi danh mục.' });
    } catch (delErr) {
      await client.query('ROLLBACK');

      // 3. Nếu vướng Foreign Key ở OrderItems/RFQs, tự động chuyển sang Soft Delete (Status = 'DELETED')
      const companyId = req.user?.company_id || 0;
      let softDelQuery = `UPDATE products SET status = 'DELETED' WHERE product_id = $1`;
      let params = [productId];

      if (req.user?.user_type === 'COMPANY_ADMIN') {
        softDelQuery += ` AND seller_company_id = $2`;
        params.push(companyId);
      }
      const softResult = await pool.query(softDelQuery, params);
      
      if (softResult.rowCount === 0) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa sản phẩm này.' });
      }

      res.json({ success: true, message: 'Sản phẩm có đơn hàng lịch sử đã được lưu vết và đánh dấu Đã Xóa (Soft Delete).' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa sản phẩm.' });
  }
};

const updateProductPrices = async (req, res) => {
  const { priceType, prices, costPrice, basePrice, product_ids } = req.body;
  const targetIds = (product_ids && Array.isArray(product_ids) && product_ids.length > 0)
    ? product_ids
    : [req.params.id];

  // 1. Swimlane System: Xác thực tính hợp lệ của dữ liệu (Validation)
  if (!['ORIGINAL', 'TIER', 'CUSTOMER', 'CONTRACT'].includes(priceType)) {
    return res.status(400).json({ success: false, message: 'Loại hình thiết lập giá không hợp lệ (ORIGINAL, TIER, CUSTOMER, CONTRACT)' });
  }

  if (priceType === 'ORIGINAL') {
    const costVal = Number(costPrice || 0);
    const baseVal = Number(basePrice || 0);
    if (isNaN(baseVal) || baseVal < 0) {
      return res.status(400).json({ success: false, message: 'Giá cơ sở không hợp lệ. Phải là số dương.' });
    }
    if (costVal > 0 && costVal > baseVal) {
      return res.status(400).json({ success: false, message: 'Giá vốn không thể lớn hơn Giá cơ sở.' });
    }
  }

  try {
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const companyId = req.user?.company_id || 0;

      for (const pId of targetIds) {
        const productId = parseInt(pId);
        if (isNaN(productId)) continue;

        if (req.user?.user_type === 'COMPANY_ADMIN') {
          const pCheck = await client.query('SELECT 1 FROM products WHERE product_id = $1 AND seller_company_id = $2', [productId, companyId]);
          if (pCheck.rows.length === 0) continue; // Không có quyền
        }

        // CHẾ ĐỘ 1: GIÁ GỐC -> Chạy vòng lặp UPSERT vào product_prices
        if (priceType === 'ORIGINAL') {
          const costVal = Number(costPrice || 0);
          const baseVal = Number(basePrice || 0);

          await client.query(`
            INSERT INTO product_prices (product_id, cost_price, base_price)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_id) DO UPDATE SET cost_price = EXCLUDED.cost_price, base_price = EXCLUDED.base_price
          `, [productId, costVal, baseVal]);
        } 
        
        // CHẾ ĐỘ 2: SỐ LƯỢNG (TIER) -> Chạy vòng lặp DELETE và vòng lặp INSERT vào product_tier_prices
        else if (priceType === 'TIER') {
          await client.query('DELETE FROM product_tier_prices WHERE product_id = $1', [productId]);

          if (Array.isArray(prices)) {
            for (const tier of prices) {
              if (!tier.price_per_unit || Number(tier.price_per_unit) <= 0) continue;
              await client.query(
                'INSERT INTO product_tier_prices (product_id, tier_level, min_quantity, price_per_unit) VALUES ($1, $2, $3, $4)', 
                [productId, tier.tier_level, tier.min_quantity || 1, Number(tier.price_per_unit)]
              );
            }
          }
        } 
        
        // CHẾ ĐỘ 3: HỢP ĐỒNG (CONTRACT) -> Chạy vòng lặp INSERT và UPDATE vào contract_prices
        else if (priceType === 'CONTRACT') {
          if (Array.isArray(prices)) {
            for (const ctp of prices) {
              if (!ctp.price_per_unit || !ctp.company_id) continue;
              
              const contractNumber = ctp.contract_number || `CTR-${ctp.company_id}-${Date.now()}`;
              
              // Find or create Contract
              let contractResult = await client.query(
                'SELECT contract_id FROM contracts WHERE contract_number = $1 AND buyer_company_id = $2', 
                [contractNumber, ctp.company_id]
              );
              
              let contractId;
              if (contractResult.rows.length === 0) {
                const insertResult = await client.query(
                  "INSERT INTO contracts (buyer_company_id, contract_number, end_date, status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING contract_id", 
                  [ctp.company_id, contractNumber, ctp.valid_until ? new Date(ctp.valid_until) : new Date('2027-12-31')]
                );
                contractId = insertResult.rows[0].contract_id;
              } else {
                contractId = contractResult.rows[0].contract_id;
              }

              const cpCheck = await client.query('SELECT 1 FROM contract_prices WHERE contract_id = $1 AND product_id = $2', [contractId, productId]);

              if (cpCheck.rows.length > 0) {
                await client.query('UPDATE contract_prices SET contract_price = $1 WHERE contract_id = $2 AND product_id = $3', [Number(ctp.price_per_unit), contractId, productId]);
              } else {
                await client.query('INSERT INTO contract_prices (contract_id, product_id, contract_price) VALUES ($1, $2, $3)', [contractId, productId, Number(ctp.price_per_unit)]);
              }
            }
          }
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Cập nhật giá thành công' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating prices:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật giá' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductPrices
};
