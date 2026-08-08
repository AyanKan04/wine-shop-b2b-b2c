const { getPool } = require('../config/db');
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
    const result = await pool.query(`
      SELECT u.user_id, u.username, u.email, u.password_hash, u.user_type, u.company_id, c.company_name, u.status
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.company_id
      WHERE u.username = $1
    `, [username]);

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập không tồn tại.' });
    }
    
    if (user.status === 'PENDING') {
      return res.status(401).json({ success: false, message: 'Tài khoản của bạn đang chờ Admin phê duyệt. Vui lòng thử lại sau.' });
    }
    
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Tài khoản của bạn đã bị khóa hoặc từ chối.' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác.' });
    }

    // Tạo token thật (sử dụng JWT_SECRET)
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        username: user.username, 
        user_type: user.user_type,
        company_id: user.company_id 
      }, 
      process.env.JWT_SECRET || 'RuuB2BSuperSecretKey2024',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token: token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        company_name: user.company_name || 'B2B Admin System'
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
    const checkUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email hoặc Tên đăng nhập đã tồn tại trên hệ thống.' });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo mã công ty ngẫu nhiên để không bị trùng (vd: COMP-XXXX)
    const companyCode = 'COMP-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Transaction để đảm bảo tính toàn vẹn dữ liệu
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Tạo Company
      const companyResult = await client.query(`
        INSERT INTO companies (company_code, company_name, tax_code, company_type, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING company_id
      `, [companyCode, company_name, tax_code, 'BUYER', 'PENDING']);
      
      const newCompanyId = companyResult.rows[0].company_id;

      // 2. Tạo User
      const userResult = await client.query(`
        INSERT INTO users (company_id, email, username, password_hash, user_type, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id
      `, [newCompanyId, email, username, hashedPassword, 'BUYER_REP', 'PENDING']);

      const newUserId = userResult.rows[0].user_id;

      // 3. Tạo License (nếu được cung cấp trong registration payload)
      if (license_number) {
        await client.query(`
          INSERT INTO company_licenses (company_id, license_type, license_number, issue_date, expiry_date, document_url, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_VERIFICATION')
        `, [
          newCompanyId, 
          license_type || 'Giấy phép Bán buôn Rượu', 
          license_number, 
          issue_date ? new Date(issue_date) : new Date(), 
          expiry_date ? new Date(expiry_date) : new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), 
          '/uploads/license_default.pdf'
        ]);
      }

      await client.query('COMMIT');

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
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
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
    const result = await pool.query(`
      SELECT u.user_id, u.username, u.user_type, u.email, c.company_id, c.company_name, c.tax_code, c.status as company_status
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.company_id
      WHERE u.user_id = $1
    `, [userId]);

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        user_type: user.user_type,
        email: user.email,
        company: user.company_id ? {
          company_id: user.company_id,
          company_name: user.company_name,
          tax_code: user.tax_code,
          status: user.company_status
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
