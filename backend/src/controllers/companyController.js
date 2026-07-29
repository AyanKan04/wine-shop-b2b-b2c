const { dbMock, persistLicense, updateLicenseStatus } = require('../config/db');

// Register Company & Upload License
const registerCompany = async (req, res) => {
  const { company_name, tax_code, license_number, license_type, issue_date, expiry_date } = req.body;
  
  const newComp = {
    company_id: dbMock.companies.length + 1,
    company_code: 'COMP-' + Math.floor(1000 + Math.random() * 9000),
    company_name: company_name || 'Doanh nghiệp đăng ký mới',
    tax_code: tax_code || '0309999888',
    company_type: 'BUYER',
    status: 'PENDING',
    created_at: new Date().toISOString().slice(0, 10)
  };
  dbMock.companies.push(newComp);

  // Set document URL from Multer req.file or fallback
  const docUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.document_url || '/uploads/license_default.pdf');

  const newLicense = {
    license_id: dbMock.licenses.length + 1,
    company_id: newComp.company_id,
    company_name: newComp.company_name,
    license_type: license_type || 'Giấy phép Bán buôn Rượu',
    license_number: license_number || '999/GP-SCT',
    issue_date: issue_date || '2026-07-30',
    expiry_date: expiry_date || '2031-07-30',
    document_url: docUrl,
    status: 'PENDING_VERIFICATION'
  };
  dbMock.licenses.push(newLicense);

  // Persist the license to MS SQL Server
  await persistLicense(newLicense);

  res.json({ 
    success: true, 
    message: 'Đăng ký doanh nghiệp thành công, chờ Admin phê duyệt giấy phép!', 
    company: newComp,
    license: newLicense
  });
};

// Admin License Approvals
const getAdminLicenses = (req, res) => {
  res.json({ success: true, data: dbMock.licenses });
};

const approveLicense = async (req, res) => {
  const licId = parseInt(req.params.id);
  const lic = dbMock.licenses.find(l => l.license_id === licId);
  if (lic) {
    lic.status = 'VERIFIED';
    
    // Auto active company in memory
    const comp = dbMock.companies.find(c => c.company_id === lic.company_id);
    if (comp) {
      comp.status = 'ACTIVE';
    }

    // Persist status change to SQL Server
    await updateLicenseStatus(licId, 'VERIFIED');
    return res.json({ success: true, message: 'Đã phê duyệt Giấy phép Rượu hợp lệ!' });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy giấy phép' });
};

module.exports = {
  registerCompany,
  getAdminLicenses,
  approveLicense
};
