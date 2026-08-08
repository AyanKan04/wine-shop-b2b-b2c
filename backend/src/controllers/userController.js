const { getPool } = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/users - Lấy danh sách người dùng (hỗ trợ search và phân quyền)
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const pool = await getPool();
    
    let query = `
      SELECT u.user_id, u.username, u.email, u.first_name, u.last_name, u.phone_number, 
             u.user_type, u.status, u.last_login_at, u.created_at,
             c.company_id, c.company_name 
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.company_id
    `;

    let params = [];
    let paramIndex = 1;

    // Nếu không phải là PLATFORM_ADMIN, chỉ cho phép xem user thuộc cùng công ty
    if (req.user.user_type !== 'PLATFORM_ADMIN') {
      query += ` WHERE u.company_id = $${paramIndex++} AND u.status != 'DELETED'`;
      params.push(req.user.company_id);
      
      if (search) {
        query += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
    } else {
      query += ` WHERE u.user_type IN ('PLATFORM_ADMIN', 'COMPANY_ADMIN') AND u.status != 'DELETED'`;
      if (search) {
        query += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải danh sách người dùng' });
  }
};

// POST /api/users - Thêm người dùng mới
const createUser = async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number, user_type, company_id } = req.body;

  if (!username || !email || !password || !user_type) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin bắt buộc!' });
  }

  try {
    const pool = await getPool();

    // Check if email or username exists
    const checkResult = await pool.query('SELECT user_id FROM users WHERE email = $1 OR username = $2', [email, username]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email hoặc Username đã tồn tại!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Nếu là Company Admin thì chỉ được phép tạo user cho company của họ
    let targetCompanyId = company_id;
    if (req.user.user_type === 'COMPANY_ADMIN') {
      targetCompanyId = req.user.company_id;
      // Tránh việc Company Admin tạo tài khoản Platform Admin
      if (user_type === 'PLATFORM_ADMIN') {
        return res.status(403).json({ success: false, message: 'Không có quyền tạo tài khoản Platform Admin' });
      }
      
      // Giới hạn tạo tối đa 5 tài khoản nhân viên (Tổng cộng 6 tính cả admin)
      const countResult = await pool.query(`SELECT COUNT(*) FROM users WHERE company_id = $1 AND status != 'DELETED'`, [targetCompanyId]);
      const currentCount = parseInt(countResult.rows[0].count);
      if (currentCount >= 6) {
        return res.status(400).json({ success: false, message: 'Doanh nghiệp đã đạt giới hạn tạo 5 tài khoản nhân viên nội bộ.' });
      }
    }

    const result = await pool.query(`
        INSERT INTO users (company_id, email, username, password_hash, first_name, last_name, phone_number, user_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
        RETURNING user_id
      `, [targetCompanyId || null, email, username, hashedPassword, first_name || null, last_name || null, phone_number || null, user_type]);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: { user_id: result.rows[0].user_id, username, email, user_type }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo tài khoản' });
  }
};

// PUT /api/users/:id - Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { first_name, last_name, phone_number, user_type, status } = req.body;

  try {
    const pool = await getPool();

    // Check permission
    const userCheck = await pool.query('SELECT company_id FROM users WHERE user_id = $1', [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const targetCompanyId = userCheck.rows[0].company_id;
    if (req.user.user_type !== 'PLATFORM_ADMIN' && targetCompanyId && targetCompanyId !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền cập nhật User này' });
    }

    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    if (first_name !== undefined) { setClauses.push(`first_name = $${paramIndex++}`); params.push(first_name); }
    if (last_name !== undefined) { setClauses.push(`last_name = $${paramIndex++}`); params.push(last_name); }
    if (phone_number !== undefined) { setClauses.push(`phone_number = $${paramIndex++}`); params.push(phone_number); }
    if (user_type !== undefined) { setClauses.push(`user_type = $${paramIndex++}`); params.push(user_type); }
    if (status !== undefined) { setClauses.push(`status = $${paramIndex++}`); params.push(status); }
    
    if (setClauses.length > 0) {
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(userId);
      await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex}`, params);
    }

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật tài khoản' });
  }
};

// DELETE /api/users/:id - Xóa người dùng (Hard delete với Soft Delete Fallback)
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const pool = await getPool();
    
    // Check permission
    const userCheck = await pool.query('SELECT company_id FROM users WHERE user_id = $1', [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const targetCompanyId = userCheck.rows[0].company_id;
    if (req.user.user_type !== 'PLATFORM_ADMIN' && targetCompanyId && targetCompanyId !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa User này' });
    }

    try {
      // 1. Thử Xóa cứng (Hard Delete)
      await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);

      return res.json({ success: true, message: 'Đã xóa hoàn toàn tài khoản khỏi hệ thống.' });
    } catch (delErr) {
      // 2. Nếu vướng rào cản Foreign Key (Đơn hàng/Lịch sử), tự động chuyển sang Soft Delete
      await pool.query("UPDATE users SET status = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [userId]);

      return res.json({ success: true, message: 'Tài khoản đã được lưu vết và chuyển sang trạng thái Đã Xóa (Soft Delete).' });
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa tài khoản' });
  }
};

// PUT /api/users/:id/lock - Khóa / Mở khóa người dùng
const lockUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const pool = await getPool();
    
    // Check permission
    const userCheck = await pool.query('SELECT company_id, status FROM users WHERE user_id = $1', [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const targetCompanyId = userCheck.rows[0].company_id;
    if (req.user.user_type !== 'PLATFORM_ADMIN' && targetCompanyId && targetCompanyId !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền khóa User này' });
    }

    const currentStatus = userCheck.rows[0].status;
    const newStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';

    await pool.query("UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2", [newStatus, userId]);

    res.json({ success: true, message: newStatus === 'LOCKED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
  } catch (err) {
    console.error('Error locking user:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi khóa tài khoản' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  lockUser
};
