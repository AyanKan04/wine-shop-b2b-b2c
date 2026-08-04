const { getPool } = require('../config/db');
const sql = require('mssql');

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
      SELECT p.*, c.CategoryName as Category,
             pp.CostPrice, pp.BasePrice,
             (SELECT * FROM ProductTierPrices t WHERE t.ProductID = p.ProductID ORDER BY TierLevel ASC FOR JSON PATH) as tier_prices
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN ProductPrices pp ON pp.ProductID = p.ProductID
      WHERE 1=1
    `;
    
    if (category && category !== 'ALL') query += ` AND c.CategoryName LIKE @Category`;
    if (country) query += ` AND p.CountryOfOrigin LIKE @Country`;
    if (grape) query += ` AND p.GrapeVariety LIKE @Grape`;
    if (search) query += ` AND (p.ProductName LIKE @Search OR p.SKU LIKE @Search)`;
    if (priceStatus === 'PRICED') query += ` AND (pp.BasePrice > 0 OR EXISTS (SELECT 1 FROM ProductTierPrices WHERE ProductID = p.ProductID))`;
    if (priceStatus === 'UNPRICED') query += ` AND (pp.BasePrice IS NULL OR pp.BasePrice = 0) AND NOT EXISTS (SELECT 1 FROM ProductTierPrices WHERE ProductID = p.ProductID)`;
    
    const request = pool.request();
    if (category && category !== 'ALL') request.input('Category', sql.NVarChar, `%${category}%`);
    if (country) request.input('Country', sql.NVarChar, `%${country}%`);
    if (grape) request.input('Grape', sql.NVarChar, `%${grape}%`);
    if (search) request.input('Search', sql.NVarChar, `%${search}%`);

    const result = await request.query(query);

    // Map database results to frontend format
    const products = result.recordset.map(prod => mapProductToFrontend(prod));

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
    const result = await pool.request()
      .input('ProductID', sql.BigInt, req.params.id)
      .query(`
        SELECT p.*, c.CategoryName as Category,
             (SELECT * FROM ProductTierPrices t WHERE t.ProductID = p.ProductID ORDER BY TierLevel ASC FOR JSON PATH) as tier_prices
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.ProductID = @ProductID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const prod = mapProductToFrontend(result.recordset[0]);

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
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const result = await transaction.request()
        .input('SKU', sql.NVarChar, sku)
        .input('ProductName', sql.NVarChar, product_name)
        .input('Category', sql.NVarChar, category)
        .input('CountryOfOrigin', sql.NVarChar, country_of_origin)
        .input('Region', sql.NVarChar, region)
        .input('GrapeVariety', sql.NVarChar, grape_variety)
        .input('VintageYear', sql.Int, vintage_year)
        .input('AlcoholContent', sql.Decimal(5,2), alcohol_content)
        .input('VolumeML', sql.Int, volume_ml)
        .input('MOQ', sql.Int, moq)
        .input('ImageUrl', sql.NVarChar, image_url)
        .input('Description', sql.NVarChar, description)
        .query(`
          INSERT INTO Products (SKU, ProductName, Category, CountryOfOrigin, Region, GrapeVariety, VintageYear, AlcoholContent, VolumeML, MOQ, ImageUrl, Description)
          OUTPUT INSERTED.ProductID
          VALUES (@SKU, @ProductName, @Category, @CountryOfOrigin, @Region, @GrapeVariety, @VintageYear, @AlcoholContent, @VolumeML, @MOQ, @ImageUrl, @Description)
        `);

      const productId = result.recordset[0].ProductID;

      // Insert Tier Prices
      if (tier_prices && Array.isArray(tier_prices)) {
        for (const tier of tier_prices) {
          await transaction.request()
            .input('ProductID', sql.BigInt, productId)
            .input('TierLevel', sql.Int, tier.tier_level)
            .input('MinQuantity', sql.Int, tier.min_quantity)
            .input('PricePerUnit', sql.Decimal(18,2), tier.price_per_unit)
            .query(`
              INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit)
              VALUES (@ProductID, @TierLevel, @MinQuantity, @PricePerUnit)
            `);
        }
      }

      await transaction.commit();
      res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', product_id: productId });
    } catch (err) {
      await transaction.rollback();
      throw err;
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
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction.request()
        .input('ProductID', sql.BigInt, productId)
        .input('SKU', sql.NVarChar, sku)
        .input('ProductName', sql.NVarChar, product_name)
        .input('Category', sql.NVarChar, category)
        .input('CountryOfOrigin', sql.NVarChar, country_of_origin)
        .input('Region', sql.NVarChar, region)
        .input('GrapeVariety', sql.NVarChar, grape_variety)
        .input('VintageYear', sql.Int, vintage_year)
        .input('AlcoholContent', sql.Decimal(5,2), alcohol_content)
        .input('VolumeML', sql.Int, volume_ml)
        .input('MOQ', sql.Int, moq)
        .input('ImageUrl', sql.NVarChar, image_url)
        .input('Description', sql.NVarChar, description)
        .query(`
          UPDATE Products SET 
            SKU = @SKU, ProductName = @ProductName, Category = @Category, 
            CountryOfOrigin = @CountryOfOrigin, Region = @Region, GrapeVariety = @GrapeVariety, 
            VintageYear = @VintageYear, AlcoholContent = @AlcoholContent, VolumeML = @VolumeML, 
            MOQ = @MOQ, ImageUrl = @ImageUrl, Description = @Description
          WHERE ProductID = @ProductID
        `);

      await transaction.request()
        .input('ProductID', sql.BigInt, productId)
        .query(`DELETE FROM ProductTierPrices WHERE ProductID = @ProductID`);

      if (tier_prices && Array.isArray(tier_prices)) {
        for (const tier of tier_prices) {
          await transaction.request()
            .input('ProductID', sql.BigInt, productId)
            .input('TierLevel', sql.Int, tier.tier_level)
            .input('MinQuantity', sql.Int, tier.min_quantity)
            .input('PricePerUnit', sql.Decimal(18,2), tier.price_per_unit)
            .query(`
              INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit)
              VALUES (@ProductID, @TierLevel, @MinQuantity, @PricePerUnit)
            `);
        }
      }

      await transaction.commit();
      res.json({ success: true, message: 'Cập nhật sản phẩm & giá thành công' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật sản phẩm' });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('ProductID', sql.BigInt, req.params.id)
      .query(`DELETE FROM Products WHERE ProductID = @ProductID`);
      
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa sản phẩm. Có thể do ràng buộc dữ liệu.' });
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

    // 2. Swimlane System: Khởi tạo Transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const pId of targetIds) {
        const productId = parseInt(pId);
        if (isNaN(productId)) continue;

        // 3. Swimlane Database: Thực thi theo từng chế độ trong Activity Diagram

        // CHẾ ĐỘ 1: GIÁ GỐC -> Chạy vòng lặp UPSERT vào ProductPrices
        if (priceType === 'ORIGINAL') {
          const costVal = Number(costPrice || 0);
          const baseVal = Number(basePrice || 0);

          await transaction.request()
            .input('ProductID', sql.BigInt, productId)
            .input('CostPrice', sql.Decimal(18,2), costVal)
            .input('BasePrice', sql.Decimal(18,2), baseVal)
            .query(`
              IF EXISTS (SELECT 1 FROM ProductPrices WHERE ProductID = @ProductID)
              BEGIN
                UPDATE ProductPrices 
                SET CostPrice = @CostPrice, BasePrice = @BasePrice
                WHERE ProductID = @ProductID;
              END
              ELSE
              BEGIN
                INSERT INTO ProductPrices (ProductID, CostPrice, BasePrice)
                VALUES (@ProductID, @CostPrice, @BasePrice);
              END
            `);
        } 
        
        // CHẾ ĐỘ 2: SỐ LƯỢNG (TIER) -> Chạy vòng lặp DELETE và vòng lặp INSERT vào ProductTierPrices
        else if (priceType === 'TIER') {
          // Step 2a: Chạy DELETE vào ProductTierPrices
          await transaction.request()
            .input('ProductID', sql.BigInt, productId)
            .query('DELETE FROM ProductTierPrices WHERE ProductID = @ProductID');

          // Step 2b: Chạy vòng lặp INSERT vào ProductTierPrices
          if (Array.isArray(prices)) {
            for (const tier of prices) {
              if (!tier.price_per_unit || Number(tier.price_per_unit) <= 0) continue;
              await transaction.request()
                .input('ProductID', sql.BigInt, productId)
                .input('TierLevel', sql.Int, tier.tier_level)
                .input('MinQuantity', sql.Int, tier.min_quantity || 1)
                .input('PricePerUnit', sql.Decimal(18,2), Number(tier.price_per_unit))
                .query('INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit) VALUES (@ProductID, @TierLevel, @MinQuantity, @PricePerUnit)');
            }
          }
        } 
        
        // CHẾ ĐỘ 3: HỢP ĐỒNG (CONTRACT) -> Chạy vòng lặp INSERT và UPDATE vào ContractPrices
        else if (priceType === 'CONTRACT') {
          if (Array.isArray(prices)) {
            for (const ctp of prices) {
              if (!ctp.price_per_unit || !ctp.company_id) continue;
              
              const contractNumber = ctp.contract_number || `CTR-${ctp.company_id}-${Date.now()}`;
              
              // Find or create Contract
              let contractResult = await transaction.request()
                .input('ContractNumber', sql.NVarChar, contractNumber)
                .input('BuyerCompanyID', sql.BigInt, ctp.company_id)
                .query('SELECT ContractID FROM Contracts WHERE ContractNumber = @ContractNumber AND BuyerCompanyID = @BuyerCompanyID');
              
              let contractId;
              if (contractResult.recordset.length === 0) {
                const insertResult = await transaction.request()
                  .input('BuyerCompanyID', sql.BigInt, ctp.company_id)
                  .input('ContractNumber', sql.NVarChar, contractNumber)
                  .input('EndDate', sql.DateTime, ctp.valid_until ? new Date(ctp.valid_until) : new Date('2027-12-31'))
                  .query("INSERT INTO Contracts (BuyerCompanyID, ContractNumber, EndDate, Status) OUTPUT INSERTED.ContractID VALUES (@BuyerCompanyID, @ContractNumber, @EndDate, 'ACTIVE')");
                contractId = insertResult.recordset[0].ContractID;
              } else {
                contractId = contractResult.recordset[0].ContractID;
              }

              // Exec INSERT or UPDATE into ContractPrices as specified by activity diagram
              await transaction.request()
                .input('ContractID', sql.BigInt, contractId)
                .input('ProductID', sql.BigInt, productId)
                .input('ContractPrice', sql.Decimal(18,2), Number(ctp.price_per_unit))
                .query(`
                  IF EXISTS (SELECT 1 FROM ContractPrices WHERE ContractID = @ContractID AND ProductID = @ProductID)
                  BEGIN
                    UPDATE ContractPrices 
                    SET ContractPrice = @ContractPrice
                    WHERE ContractID = @ContractID AND ProductID = @ProductID;
                  END
                  ELSE
                  BEGIN
                    INSERT INTO ContractPrices (ContractID, ProductID, ContractPrice)
                    VALUES (@ContractID, @ProductID, @ContractPrice);
                  END
                `);
            }
          }
        }
      }

      // 4. Swimlane Database: Commit Transaction
      await transaction.commit();
      res.json({ success: true, message: 'Cập nhật giá thành công' });
    } catch (err) {
      await transaction.rollback();
      throw err;
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
