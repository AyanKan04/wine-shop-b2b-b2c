const { getPool, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Đăng nhập
const login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!' });
  }

  try {
    const pool = await getPool();
    // Lấy thông tin user
    const result = await pool.request()
      .input('Username', sql.NVarChar, username)
      .query(`
        SELECT u.UserID, u.Username, u.Email, u.PasswordHash, u.UserType, u.CompanyID, c.CompanyName
        FROM Users u
        LEFT JOIN Companies c ON u.CompanyID = c.CompanyID
        WHERE u.Username = @Username AND u.Status = 'ACTIVE'
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập không tồn tại hoặc tài khoản bị khóa.' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác.' });
    }

    // Tạo token thật (sử dụng JWT_SECRET)
    const token = jwt.sign(
      { 
        user_id: user.UserID, 
        username: user.Username, 
        user_type: user.UserType,
        company_id: user.CompanyID 
      }, 
      process.env.JWT_SECRET || 'RuuB2BSuperSecretKey2024',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token: token,
      user: {
        user_id: user.UserID,
        username: user.Username,
        email: user.Email,
        user_type: user.UserType,
        company_name: user.CompanyName || 'B2B Admin System'
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.' });
  }
};

// 2. Đăng ký doanh nghiệp B2B
const registerUser = async (req, res) => {
  const { username, email, password, company_name, tax_code, license_type, license_number, issue_date, expiry_date } = req.body;

  if (!username || !email || !password || !company_name || !tax_code) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
  }

  try {
    const pool = await getPool();

    // Kiểm tra username/email đã tồn tại chưa
    const checkUser = await pool.request()
      .input('Email', sql.NVarChar, email)
      .input('Username', sql.NVarChar, username)
      .query('SELECT UserID FROM Users WHERE Email = @Email OR Username = @Username');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Email hoặc Tên đăng nhập đã tồn tại trên hệ thống.' });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo mã công ty ngẫu nhiên để không bị trùng (vd: COMP-XXXX)
    const companyCode = 'COMP-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Transaction để đảm bảo tính toàn vẹn dữ liệu
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Tạo Company
      const companyResult = await transaction.request()
        .input('CompanyCode', sql.NVarChar, companyCode)
        .input('CompanyName', sql.NVarChar, company_name)
        .input('TaxCode', sql.NVarChar, tax_code)
        .input('CompanyType', sql.NVarChar, 'BUYER')
        .input('Status', sql.NVarChar, 'ACTIVE')
        .query(`
          INSERT INTO Companies (CompanyCode, CompanyName, TaxCode, CompanyType, Status)
          OUTPUT INSERTED.CompanyID
          VALUES (@CompanyCode, @CompanyName, @TaxCode, @CompanyType, @Status)
        `);
      
      const newCompanyId = companyResult.recordset[0].CompanyID;

      // 2. Tạo User
      const userResult = await transaction.request()
        .input('CompanyID', sql.BigInt, newCompanyId)
        .input('Email', sql.NVarChar, email)
        .input('Username', sql.NVarChar, username)
        .input('PasswordHash', sql.NVarChar, hashedPassword)
        .input('UserType', sql.NVarChar, 'BUYER_REP')
        .input('Status', sql.NVarChar, 'ACTIVE')
        .query(`
          INSERT INTO Users (CompanyID, Email, Username, PasswordHash, UserType, Status)
          OUTPUT INSERTED.UserID
          VALUES (@CompanyID, @Email, @Username, @PasswordHash, @UserType, @Status)
        `);

      const newUserId = userResult.recordset[0].UserID;

      // 3. Tạo License (nếu được cung cấp trong registration payload)
      if (license_number) {
        await transaction.request()
          .input('CompanyID', sql.BigInt, newCompanyId)
          .input('LicenseType', sql.NVarChar, license_type || 'Giấy phép Bán buôn Rượu')
          .input('LicenseNumber', sql.NVarChar, license_number)
          .input('IssueDate', sql.Date, issue_date ? new Date(issue_date) : new Date())
          .input('ExpiryDate', sql.Date, expiry_date ? new Date(expiry_date) : new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000))
          .input('DocumentUrl', sql.NVarChar, '/uploads/license_default.pdf')
          .query(`
            INSERT INTO CompanyLicenses (CompanyID, LicenseType, LicenseNumber, IssueDate, ExpiryDate, DocumentUrl, Status)
            VALUES (@CompanyID, @LicenseType, @LicenseNumber, @IssueDate, @ExpiryDate, @DocumentUrl, 'PENDING_VERIFICATION')
          `);
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản doanh nghiệp thành công!',
        data: {
          user_id: newUserId,
          username,
          email,
          company_name: company_name,
          tax_code: tax_code,
          user_type: 'BUYER_REP'
        }
      });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }

  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký.' });
  }
};

// 3. Lấy thông tin user hiện tại (Get Me)
const getMe = async (req, res) => {
  try {
    const userId = req.user.user_id; // Đã được extract từ JWT ở Middleware
    
    const pool = await getPool();
    const result = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query(`
        SELECT u.UserID, u.Username, u.UserType, u.Email, c.CompanyID, c.CompanyName, c.TaxCode, c.Status as CompanyStatus
        FROM Users u
        LEFT JOIN Companies c ON u.CompanyID = c.CompanyID
        WHERE u.UserID = @UserID
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({
      success: true,
      data: {
        user_id: user.UserID,
        username: user.Username,
        user_type: user.UserType,
        email: user.Email,
        company: user.CompanyID ? {
          company_id: user.CompanyID,
          company_name: user.CompanyName,
          tax_code: user.TaxCode,
          status: user.CompanyStatus
        } : null
      }
    });

  } catch (err) {
    console.error('GetMe Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin.' });
  }
};

module.exports = {
  login,
  registerUser,
  getMe
};
