const { dbMock } = require('../config/db');

// Login user & return dummy JWT token
const login = (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!' });
  }

  const roleValue = role || 'BUYER_REP';
  const dummyToken = `mock_token_for_role_${roleValue}`;

  res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    token: dummyToken,
    user: {
      user_id: roleValue === 'BUYER_REP' ? 1 : 99,
      username: username,
      email: `${username}@lottesaigon.com`,
      user_type: roleValue,
      role: roleValue,
      company_name: roleValue === 'BUYER_REP' ? 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON' : 'MAISON DE L\'ALCOOL RED APRON FACTORY'
    }
  });
};

const registerUser = (req, res) => {
  const { username, email, password, company_name, tax_code } = req.body;
  res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản doanh nghiệp thành công!',
    data: {
      user_id: Math.floor(Math.random() * 1000) + 10,
      username,
      email,
      company_name: company_name || 'Doanh nghiệp mới',
      tax_code: tax_code || '0309999111',
      user_type: 'BUYER_REP'
    }
  });
};

const getMe = (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  
  let roleValue = 'BUYER_REP';
  let username = 'lotte_buyer';
  let company_name = 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON';
  
  if (token.startsWith('mock_token_for_role_')) {
    roleValue = token.replace('mock_token_for_role_', '');
    if (roleValue !== 'BUYER_REP') {
      username = 'admin_user';
      company_name = 'MAISON DE L\'ALCOOL RED APRON FACTORY';
    }
  }

  res.json({
    success: true,
    data: {
      user_id: roleValue === 'BUYER_REP' ? 1 : 99,
      username: username,
      user_type: roleValue,
      role: roleValue,
      company: {
        company_id: roleValue === 'BUYER_REP' ? 1 : 2,
        company_name: company_name,
        tax_code: roleValue === 'BUYER_REP' ? '0301234567' : '0109876543',
        status: 'ACTIVE'
      }
    }
  });
};

module.exports = {
  login,
  registerUser,
  getMe
};

