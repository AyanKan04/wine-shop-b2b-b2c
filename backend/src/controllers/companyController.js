const { getPool, sql } = require('../config/db');

// Register Company & Upload License
const registerCompany = async (req, res) => {
  const { company_name, tax_code, license_number, license_type, issue_date, expiry_date } = req.body;
  
  const companyCode = 'COMP-' + Math.floor(1000 + Math.random() * 9000);
  const docUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.document_url || '/uploads/license_default.pdf');

  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const compRes = await transaction.request()
        .input('CompanyCode', sql.NVarChar, companyCode)
        .input('CompanyName', sql.NVarChar, company_name || 'Doanh nghiệp đăng ký mới')
        .input('TaxCode', sql.NVarChar, tax_code || '0309999888')
        .input('CompanyType', sql.NVarChar, 'BUYER')
        .query(`
          INSERT INTO Companies (CompanyCode, CompanyName, TaxCode, CompanyType, Status, CreatedAt)
          OUTPUT INSERTED.CompanyID
          VALUES (@CompanyCode, @CompanyName, @TaxCode, @CompanyType, 'PENDING', GETDATE())
        `);
      
      const companyId = compRes.recordset[0].CompanyID;

      const licRes = await transaction.request()
        .input('CompanyID', sql.BigInt, companyId)
        .input('LicenseType', sql.NVarChar, license_type || 'Giấy phép Bán buôn Rượu')
        .input('LicenseNumber', sql.NVarChar, license_number || '999/GP-SCT')
        .input('IssueDate', sql.Date, issue_date ? new Date(issue_date) : new Date('2026-07-30'))
        .input('ExpiryDate', sql.Date, expiry_date ? new Date(expiry_date) : new Date('2031-07-30'))
        .input('DocumentUrl', sql.NVarChar, docUrl)
        .query(`
          INSERT INTO CompanyLicenses (CompanyID, LicenseType, LicenseNumber, IssueDate, ExpiryDate, DocumentUrl, Status)
          OUTPUT INSERTED.LicenseID
          VALUES (@CompanyID, @LicenseType, @LicenseNumber, @IssueDate, @ExpiryDate, @DocumentUrl, 'PENDING_VERIFICATION')
        `);

      const licenseId = licRes.recordset[0].LicenseID;
      
      await transaction.commit();

      res.status(201).json({ 
        success: true, 
        message: 'Đăng ký doanh nghiệp thành công, chờ Admin phê duyệt giấy phép!', 
        company: { company_id: companyId, company_code: companyCode, company_name, tax_code },
        license: { license_id: licenseId, status: 'PENDING_VERIFICATION' }
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
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
    const result = await pool.request().query(`
      SELECT l.LicenseID as license_id, l.CompanyID as company_id, 
             c.CompanyName as company_name, l.LicenseType as license_type,
             l.LicenseNumber as license_number, l.IssueDate as issue_date,
             l.ExpiryDate as expiry_date, l.DocumentUrl as document_url,
             l.Status as status
      FROM CompanyLicenses l
      JOIN Companies c ON l.CompanyID = c.CompanyID
      ORDER BY l.LicenseID DESC
    `);
    
    // Format dates to string
    const data = result.recordset.map(row => ({
      ...row,
      issue_date: row.issue_date ? row.issue_date.toISOString().split('T')[0] : null,
      expiry_date: row.expiry_date ? row.expiry_date.toISOString().split('T')[0] : null
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
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const licCheck = await transaction.request()
        .input('LicenseID', sql.BigInt, licId)
        .query(`SELECT CompanyID FROM CompanyLicenses WHERE LicenseID = @LicenseID`);
      
      if (licCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy giấy phép' });
      }

      const companyId = licCheck.recordset[0].CompanyID;

      // Update license status
      await transaction.request()
        .input('LicenseID', sql.BigInt, licId)
        .query(`UPDATE CompanyLicenses SET Status = 'VERIFIED' WHERE LicenseID = @LicenseID`);
      
      // Auto active company
      await transaction.request()
        .input('CompanyID', sql.BigInt, companyId)
        .query(`UPDATE Companies SET Status = 'ACTIVE' WHERE CompanyID = @CompanyID`);

      await transaction.commit();
      return res.json({ success: true, message: 'Đã phê duyệt Giấy phép Rượu hợp lệ!' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error approving license:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi phê duyệt giấy phép' });
  }
};

const getCompanies = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        c.CompanyID as company_id, 
        c.CompanyCode as company_code, 
        c.CompanyName as company_name, 
        c.TaxCode as tax_code, 
        c.CompanyType as company_type, 
        c.Status as status,
        ISNULL((SELECT CreditLimitAmount FROM CreditLimits WHERE CompanyID = c.CompanyID), 0) as credit_limit,
        ISNULL((SELECT UsedAmount FROM CreditLimits WHERE CompanyID = c.CompanyID), 0) as used_credit
      FROM Companies c
      ORDER BY c.CreatedAt DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách công ty' });
  }
};

const rejectLicense = async (req, res) => {
  const licId = parseInt(req.params.id);
  try {
    const pool = await getPool();
    await pool.request()
      .input('LicenseID', sql.BigInt, licId)
      .query(`UPDATE CompanyLicenses SET Status = 'REJECTED' WHERE LicenseID = @LicenseID`);
    res.json({ success: true, message: 'Đã từ chối Giấy phép!' });
  } catch (err) {
    console.error('Error rejecting license:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi từ chối giấy phép' });
  }
};

const toggleCompanyStatus = async (req, res) => {
  const companyId = parseInt(req.params.id);
  try {
    const pool = await getPool();
    const check = await pool.request()
      .input('CompanyID', sql.BigInt, companyId)
      .query(`SELECT Status FROM Companies WHERE CompanyID = @CompanyID`);
    if (check.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
    }
    const currentStatus = check.recordset[0].Status;
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await pool.request()
      .input('CompanyID', sql.BigInt, companyId)
      .input('NewStatus', sql.NVarChar, newStatus)
      .query(`UPDATE Companies SET Status = @NewStatus WHERE CompanyID = @CompanyID`);
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
