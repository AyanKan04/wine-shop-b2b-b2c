const { getPool } = require('../config/db');
const sql = require('mssql/msnodesqlv8');

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
    tier_prices: mappedTierPrices
  };
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, country, grape, search } = req.query;
    const pool = await getPool();
    
    let query = `
      SELECT p.*, c.CategoryName as Category,
             (SELECT * FROM ProductTierPrices t WHERE t.ProductID = p.ProductID ORDER BY TierLevel ASC FOR JSON PATH) as tier_prices
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE 1=1
    `;
    
    if (category) query += ` AND Category LIKE @Category`;
    if (country) query += ` AND CountryOfOrigin LIKE @Country`;
    if (grape) query += ` AND GrapeVariety LIKE @Grape`;
    if (search) query += ` AND ProductName LIKE @Search`;
    
    const request = pool.request();
    if (category) request.input('Category', sql.NVarChar, `%${category}%`);
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
  const productId = req.params.id;
  const { priceType, prices } = req.body;
  
  if (!['TIER', 'CUSTOMER', 'CONTRACT'].includes(priceType)) {
    return res.status(400).json({ success: false, message: 'Loại giá không hợp lệ (TIER, CUSTOMER, CONTRACT)' });
  }

  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      if (priceType === 'TIER') {
        await transaction.request().input('ProductID', sql.BigInt, productId).query('DELETE FROM ProductTierPrices WHERE ProductID = @ProductID');
        for (const tier of prices) {
          await transaction.request()
            .input('ProductID', sql.BigInt, productId)
            .input('TierLevel', sql.Int, tier.tier_level)
            .input('MinQuantity', sql.Int, tier.min_quantity)
            .input('PricePerUnit', sql.Decimal(18,2), tier.price_per_unit)
            .query('INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit) VALUES (@ProductID, @TierLevel, @MinQuantity, @PricePerUnit)');
        }
      } else if (priceType === 'CUSTOMER') {
        await transaction.request().input('ProductID', sql.BigInt, productId).query('DELETE FROM CustomerPrices WHERE ProductID = @ProductID');
        for (const cp of prices) {
          await transaction.request()
            .input('ProductID', sql.BigInt, productId)
            .input('BuyerCompanyID', sql.BigInt, cp.company_id)
            .input('PricePerUnit', sql.Decimal(18,2), cp.price_per_unit)
            .query('INSERT INTO CustomerPrices (ProductID, BuyerCompanyID, PricePerUnit) VALUES (@ProductID, @BuyerCompanyID, @PricePerUnit)');
        }
      } else if (priceType === 'CONTRACT') {
        await transaction.request().input('ProductID', sql.BigInt, productId).query('DELETE FROM ContractPrices WHERE ProductID = @ProductID');
        for (const ctp of prices) {
          let contractResult = await transaction.request()
            .input('ContractNumber', sql.NVarChar, ctp.contract_number)
            .input('BuyerCompanyID', sql.BigInt, ctp.company_id)
            .query('SELECT ContractID FROM Contracts WHERE ContractNumber = @ContractNumber AND BuyerCompanyID = @BuyerCompanyID');
          
          let contractId;
          if (contractResult.recordset.length === 0) {
            const insertResult = await transaction.request()
              .input('BuyerCompanyID', sql.BigInt, ctp.company_id)
              .input('ContractNumber', sql.NVarChar, ctp.contract_number)
              .input('EndDate', sql.DateTime, new Date(ctp.valid_until))
              .query("INSERT INTO Contracts (BuyerCompanyID, ContractNumber, EndDate, Status) OUTPUT INSERTED.ContractID VALUES (@BuyerCompanyID, @ContractNumber, @EndDate, 'ACTIVE')");
            contractId = insertResult.recordset[0].ContractID;
          } else {
            contractId = contractResult.recordset[0].ContractID;
          }

          await transaction.request()
            .input('ContractID', sql.BigInt, contractId)
            .input('ProductID', sql.BigInt, productId)
            .input('ContractPrice', sql.Decimal(18,2), ctp.price_per_unit)
            .query('INSERT INTO ContractPrices (ContractID, ProductID, ContractPrice) VALUES (@ContractID, @ProductID, @ContractPrice)');
        }
      }

      await transaction.commit();
      res.json({ success: true, message: 'Cập nhật giá thành công!' });
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
