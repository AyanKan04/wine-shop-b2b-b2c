const { dbMock } = require('../config/db');

// Register Company & Upload License
const registerCompany = (req, res) => {
  const { company_name, tax_code, license_number } = req.body;
  const newComp = {
    company_id: dbMock.companies.length + 1,
    company_code: 'COMP-' + Math.floor(1000 + Math.random() * 9000),
    company_name: company_name || 'Doanh nghiệp đăng ký mới',
    tax_code: tax_code || '0309999888',
    company_type: 'BUYER',
    status: 'PENDING',
    created_at: new Date().toISOString()
  };
  dbMock.companies.push(newComp);

  const newLicense = {
    license_id: dbMock.licenses.length + 1,
    company_id: newComp.company_id,
    company_name: newComp.company_name,
    license_type: 'Giấy phép Bán buôn Rượu',
    license_number: license_number || '999/GP-SCT',
    status: 'PENDING_VERIFICATION'
  };
  dbMock.licenses.push(newLicense);

  res.json({ success: true, message: 'Đăng ký doanh nghiệp thành công, chờ Admin phê duyệt giấy phép!', company: newComp });
};

// Admin License Approvals
const getAdminLicenses = (req, res) => {
  res.json({ success: true, data: dbMock.licenses });
};

const approveLicense = (req, res) => {
  const lic = dbMock.licenses.find(l => l.license_id === parseInt(req.params.id));
  if (lic) {
    lic.status = 'VERIFIED';
    return res.json({ success: true, message: 'Đã phê duyệt Giấy phép Rượu hợp lệ!' });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy giấy phép' });
};

module.exports = {
  registerCompany,
  getAdminLicenses,
  approveLicense
};
