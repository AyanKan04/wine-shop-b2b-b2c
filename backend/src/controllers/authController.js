const { dbMock } = require('../config/db');

// Login user & return dummy JWT token
const login = (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!' });
  }

  const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ruubusiness_auth_token_mock';
  res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    token: dummyToken,
    user: {
      user_id: 1,
      username: username,
      email: `${username}@lottesaigon.com`,
      user_type: 'BUYER_REP',
      company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON'
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
  res.json({
    success: true,
    data: {
      user_id: 1,
      username: 'lotte_buyer',
      user_type: 'BUYER_REP',
      company: {
        company_id: 1,
        company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
        tax_code: '0301234567',
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
