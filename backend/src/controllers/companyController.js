const { getPool } = require('../config/db');

// Register Company & Upload License
const registerCompany = async (req, res) => {
  const { company_name, tax_code, license_number, license_type, issue_date, expiry_date } = req.body;
  
  const companyCode = 'COMP-' + Math.floor(1000 + Math.random() * 9000);
  const docUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.document_url || '/uploads/license_default.pdf');

  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const compRes = await client.query(`
        INSERT INTO companies (company_code, company_name, tax_code, company_type, status, created_at)
        VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP)
        RETURNING company_id
      `, [companyCode, company_name || 'Doanh nghiệp đăng ký mới', tax_code || '0309999888', 'BUYER']);
      
      const companyId = compRes.rows[0].company_id;

      const licRes = await client.query(`
        INSERT INTO company_licenses (company_id, license_type, license_number, issue_date, expiry_date, document_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_VERIFICATION')
        RETURNING license_id
      `, [
        companyId, 
        license_type || 'Giấy phép Bán buôn Rượu', 
        license_number || '999/GP-SCT', 
        issue_date ? new Date(issue_date) : new Date('2026-07-30'), 
        expiry_date ? new Date(expiry_date) : new Date('2031-07-30'), 
        docUrl
      ]);

      const licenseId = licRes.rows[0].license_id;
      
      await client.query('COMMIT');

      res.status(201).json({ 
        success: true, 
        message: 'Đăng ký doanh nghiệp thành công, chờ Admin phê duyệt giấy phép!', 
        company: { company_id: companyId, company_code: companyCode, company_name, tax_code },
        license: { license_id: licenseId, status: 'PENDING_VERIFICATION' }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error registering company:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký doanh nghiệp' });
  }
};

// Admin License Approvals
const getAdminLicenses = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT l.license_id as license_id, l.company_id as company_id, 
             c.company_name as company_name, l.license_type as license_type,
             l.license_number as license_number, l.issue_date as issue_date,
             l.expiry_date as expiry_date, l.document_url as document_url,
             l.status as status
      FROM company_licenses l
      JOIN companies c ON l.company_id = c.company_id
      ORDER BY l.license_id DESC
    `);
    
    // Format dates to string
    const data = result.rows.map(row => ({
      ...row,
      issue_date: row.issue_date ? new Date(row.issue_date).toISOString().split('T')[0] : null,
      expiry_date: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : null
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching licenses:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách giấy phép' });
  }
};

const approveLicense = async (req, res) => {
  const licId = parseInt(req.params.id);
  
  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const licCheck = await client.query('SELECT company_id FROM company_licenses WHERE license_id = $1', [licId]);
      
      if (licCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Không tìm thấy giấy phép' });
      }

      const companyId = licCheck.rows[0].company_id;

      // Update license status
      await client.query(`UPDATE company_licenses SET status = 'VERIFIED' WHERE license_id = $1`, [licId]);
      
      // Auto active company and its users
      await client.query(`UPDATE companies SET status = 'ACTIVE' WHERE company_id = $1`, [companyId]);
      await client.query(`UPDATE users SET status = 'ACTIVE' WHERE company_id = $1`, [companyId]);

      await client.query('COMMIT');
      return res.json({ success: true, message: 'Đã phê duyệt Giấy phép Rượu hợp lệ!' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error approving license:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi phê duyệt giấy phép' });
  }
};

const getCompanies = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 
        c.company_id as company_id, 
        c.company_code as company_code, 
        c.company_name as company_name, 
        c.tax_code as tax_code, 
        c.company_type as company_type, 
        c.status as status,
        COALESCE((SELECT credit_limit_amount FROM credit_limits WHERE company_id = c.company_id LIMIT 1), 0) as credit_limit,
        COALESCE((SELECT used_amount FROM credit_limits WHERE company_id = c.company_id LIMIT 1), 0) as used_credit
      FROM companies c
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách công ty' });
  }
};

const rejectLicense = async (req, res) => {
  const licId = parseInt(req.params.id);
  try {
    const pool = await getPool();
    
    // Find company associated with this license
    const licRes = await pool.query('SELECT company_id FROM company_licenses WHERE license_id = $1', [licId]);
    if (licRes.rows.length > 0) {
       const companyId = licRes.rows[0].company_id;
       // We can reject company and users if we want, or just reject the license. Let's reject company and users to prevent login.
       await pool.query(`UPDATE companies SET status = 'REJECTED' WHERE company_id = $1`, [companyId]);
       await pool.query(`UPDATE users SET status = 'REJECTED' WHERE company_id = $1`, [companyId]);
    }

    await pool.query(`UPDATE company_licenses SET status = 'REJECTED' WHERE license_id = $1`, [licId]);
    res.json({ success: true, message: 'Đã từ chối Giấy phép và vô hiệu hóa tài khoản công ty!' });
  } catch (err) {
    console.error('Error rejecting license:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi từ chối giấy phép' });
  }
};

const toggleCompanyStatus = async (req, res) => {
  const companyId = parseInt(req.params.id);
  try {
    const pool = await getPool();
    const check = await pool.query(`SELECT status FROM companies WHERE company_id = $1`, [companyId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
    }
    const currentStatus = check.rows[0].status;
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await pool.query(`UPDATE companies SET status = $1 WHERE company_id = $2`, [newStatus, companyId]);
    await pool.query(`UPDATE users SET status = $1 WHERE company_id = $2 AND status != 'DELETED'`, [newStatus, companyId]);
    res.json({ success: true, message: `Đã thay đổi trạng thái doanh nghiệp thành ${newStatus}`, status: newStatus });
  } catch (err) {
    console.error('Error toggling company status:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái' });
  }
};

module.exports = {
  registerCompany,
  getAdminLicenses,
  approveLicense,
  getCompanies,
  rejectLicense,
  toggleCompanyStatus
};
