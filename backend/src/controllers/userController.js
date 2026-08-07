const { getPool, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/users - Lấy danh sách người dùng (hỗ trợ search và phân quyền)
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const pool = await getPool();
    
    let query = `
      SELECT u.UserID, u.Username, u.Email, u.FirstName, u.LastName, u.PhoneNumber, 
             u.UserType, u.Status, u.LastLoginAt, u.CreatedAt,
             c.CompanyID, c.CompanyName 
      FROM Users u
      LEFT JOIN Companies c ON u.CompanyID = c.CompanyID
    `;

    // Nếu không phải là PLATFORM_ADMIN, chỉ cho phép xem user thuộc cùng công ty
    if (req.user.user_type !== 'PLATFORM_ADMIN') {
      query += ` WHERE u.CompanyID = @CompanyID AND u.Status != 'DELETED'`;
      if (search) {
        query += ` AND (u.Username LIKE @Search OR u.Email LIKE @Search)`;
      }
    } else {
      query += ` WHERE u.Status != 'DELETED'`;
      if (search) {
        query += ` AND (u.Username LIKE @Search OR u.Email LIKE @Search OR c.CompanyName LIKE @Search)`;
      }
    }

    query += ` ORDER BY u.CreatedAt DESC`;

    const request = pool.request();
    if (req.user.user_type !== 'PLATFORM_ADMIN') {
      request.input('CompanyID', sql.BigInt, req.user.company_id);
    }
    if (search) {
      request.input('Search', sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
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
    const checkResult = await pool.request()
      .input('Email', sql.NVarChar, email)
      .input('Username', sql.NVarChar, username)
      .query('SELECT UserID FROM Users WHERE Email = @Email OR Username = @Username');

    if (checkResult.recordset.length > 0) {
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
    }

    const result = await pool.request()
      .input('CompanyID', sql.BigInt, targetCompanyId || null)
      .input('Email', sql.NVarChar, email)
      .input('Username', sql.NVarChar, username)
      .input('PasswordHash', sql.NVarChar, hashedPassword)
      .input('FirstName', sql.NVarChar, first_name || null)
      .input('LastName', sql.NVarChar, last_name || null)
      .input('PhoneNumber', sql.NVarChar, phone_number || null)
      .input('UserType', sql.NVarChar, user_type)
      .query(`
        INSERT INTO Users (CompanyID, Email, Username, PasswordHash, FirstName, LastName, PhoneNumber, UserType, Status)
        OUTPUT INSERTED.UserID
        VALUES (@CompanyID, @Email, @Username, @PasswordHash, @FirstName, @LastName, @PhoneNumber, @UserType, 'ACTIVE')
      `);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: { user_id: result.recordset[0].UserID, username, email, user_type }
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
    const userCheck = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT CompanyID FROM Users WHERE UserID = @UserID');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const targetCompanyId = userCheck.recordset[0].CompanyID;
    if (req.user.user_type !== 'PLATFORM_ADMIN' && targetCompanyId && targetCompanyId !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền cập nhật User này' });
    }

    const request = pool.request().input('UserID', sql.BigInt, userId);
    const setClauses = [];
    if (first_name !== undefined) { setClauses.push("FirstName = @FirstName"); request.input('FirstName', sql.NVarChar(100), first_name); }
    if (last_name !== undefined) { setClauses.push("LastName = @LastName"); request.input('LastName', sql.NVarChar(100), last_name); }
    if (phone_number !== undefined) { setClauses.push("PhoneNumber = @PhoneNumber"); request.input('PhoneNumber', sql.NVarChar(50), phone_number); }
    if (user_type !== undefined) { setClauses.push("UserType = @UserType"); request.input('UserType', sql.NVarChar(50), user_type); }
    if (status !== undefined) { setClauses.push("Status = @Status"); request.input('Status', sql.NVarChar(50), status); }
    setClauses.push("UpdatedAt = GETDATE()");

    if (setClauses.length > 1) { // more than just UpdatedAt
      await request.query(`UPDATE Users SET ${setClauses.join(', ')} WHERE UserID = @UserID`);
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
    const userCheck = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT CompanyID FROM Users WHERE UserID = @UserID');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const targetCompanyId = userCheck.recordset[0].CompanyID;
    if (req.user.user_type !== 'PLATFORM_ADMIN' && targetCompanyId && targetCompanyId !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa User này' });
    }

    try {
      // 1. Thử Xóa cứng (Hard Delete)
      await pool.request()
        .input('UserID', sql.BigInt, userId)
        .query("DELETE FROM Users WHERE UserID = @UserID");

      return res.json({ success: true, message: 'Đã xóa hoàn toàn tài khoản khỏi hệ thống.' });
    } catch (delErr) {
      // 2. Nếu vướng rào cản Foreign Key (Đơn hàng/Lịch sử), tự động chuyển sang Soft Delete
      await pool.request()
        .input('UserID', sql.BigInt, userId)
        .query("UPDATE Users SET Status = 'DELETED', UpdatedAt = GETDATE() WHERE UserID = @UserID");

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
    const userCheck = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT CompanyID, Status FROM Users WHERE UserID = @UserID');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const targetCompanyId = userCheck.recordset[0].CompanyID;
    if (req.user.user_type !== 'PLATFORM_ADMIN' && targetCompanyId && targetCompanyId !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền khóa User này' });
    }

    const currentStatus = userCheck.recordset[0].Status;
    const newStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';

    await pool.request()
      .input('UserID', sql.BigInt, userId)
      .input('NewStatus', sql.NVarChar, newStatus)
      .query("UPDATE Users SET Status = @NewStatus, UpdatedAt = GETDATE() WHERE UserID = @UserID");

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
