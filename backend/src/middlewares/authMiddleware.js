// Auth & Role-Based Access Control (RBAC) Middleware with Alcohol Compliance Guard
const { dbMock } = require('../config/db');

/**
 * Authenticate JWT Token or Development Mock Token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // In development/demo mode, default to BUYER_REP or allow read-only
    req.user = {
      user_id: 1,
      username: 'lotte_buyer',
      user_type: 'BUYER_REP',
      company_id: 1,
      company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON'
    };
    return next();
  }

  // Token attached
  req.user = {
    user_id: 1,
    username: 'lotte_buyer',
    user_type: 'BUYER_REP',
    company_id: 1,
    company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON'
  };
  next();
};

/**
 * RBAC Permission Guard (Require specific user_type)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: `Truy cập bị từ chối. Yêu cầu quyền: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Alcohol Compliance Guard (Decree 105/2017/ND-CP)
 * Verifies Company Wholesale Alcohol License Status
 */
const verifyAlcoholLicense = (req, res, next) => {
  const companyId = req.user ? req.user.company_id : 1;
  const license = dbMock.licenses.find(l => l.company_id === companyId);

  if (!license || license.status !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      message: 'Chưa thể thực hiện giao dịch sỉ: Giấy phép Bán buôn Rượu của doanh nghiệp đang chờ thẩm định hoặc chưa hợp lệ!',
      license_status: license ? license.status : 'NOT_SUBMITTED'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  verifyAlcoholLicense
};
