import React, { useState } from 'react';
import apiService from '../services/api';

export default function AuthPage({ showToast, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Login Form State
  const [loginData, setLoginData] = useState({
    username: 'admin_platform',
    password: 'Admin@123!'
  });

  // Register Form State
  const [registerData, setRegisterData] = useState({
    company_name: '',
    tax_code: '',
    email: '',
    username: '',
    password: '',
    company_type: 'BUYER',
    license_number: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiService.login({ username: loginData.username, password: loginData.password });
      if (res.success) {
        localStorage.setItem('token', res.token);
        showToast(`Đăng nhập thành công! Xin chào ${res.user.username}`);
        if (onLoginSuccess) onLoginSuccess(res.user);
      }
    } catch (err) {
      showToast(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.company_name || !registerData.tax_code || !registerData.email) {
      showToast('Vui lòng điền đầy đủ Tên Công Ty, Mã Số Thuế và Email!');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.register(registerData);
      if (res.success) {
        showToast('Đăng ký doanh nghiệp thành công! Đã gửi hồ sơ cấp hạn mức sỉ B2B.');
        setActiveTab('login');
      }
    } catch (err) {
      showToast(err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: BRAND PROMO / B2B TRUST STRIP */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '520px'
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              fontFamily: 'var(--font-body)',
              fontWeight: '600',
              marginBottom: '15px'
            }}>
              Cổng Cung Cấp Rượu Nhập Khẩu B2B
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.4rem',
              lineHeight: '1.2',
              marginBottom: '20px'
            }}>
              Cung Cấp Rượu Cao Cấp Cho <span className="gold-gradient-text">Khách Sạn & Nhà Hàng</span>
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '35px', lineHeight: '1.7' }}>
              Hệ thống giao dịch sỉ rượu vang & rượu mạnh chính ngạch. Hỗ trợ đàm phán RFQ trực tiếp, cấp hạn mức thanh toán tín dụng Net-30 và hỗ trợ đầy đủ thủ tục CO/CQ pháp lý.
            </p>

            {/* TRUST HIGHLIGHTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-wine-glass"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>500+ Dòng Vang & Rượu Mạnh Nhập Khẩu</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phân phối chính ngạch từ Bordeaux, Scotland, Tuscany, Napa Valley.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-scale-balanced"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Bảng Giá Sỉ Phân Tầng (Tier 1 đến Tier 5)</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chiết khấu tối đa lên tới 40% cho đơn hàng số lượng lớn.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Hạn Mức Tín Dụng Trả Sau Net-30</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cấp hạn mức lên đến 1 Tỷ VNĐ cho đối tác doanh nghiệp uy tín.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span><i className="fa-solid fa-shield-halved gold-text"></i> Tuân thủ Nghị định 105/2017/NĐ-CP</span>
            <span>Hotline B2B: 1900 633 349</span>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION FORM (LOGIN / REGISTER TABS) */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '35px'
        }}>
          {/* TAB SWITCHER */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border-subtle)', marginBottom: '30px' }}>
            <button
              onClick={() => setActiveTab('login')}
              style={{
                flex: 1,
                padding: '14px 10px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
                borderBottom: activeTab === 'login' ? '2px solid var(--accent-burgundy)' : '2px solid transparent',
                marginBottom: '-2px',
                fontFamily: 'var(--font-heading)',
                fontWeight: '600',
                fontSize: '1.1rem',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setActiveTab('register')}
              style={{
                flex: 1,
                padding: '14px 10px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'register' ? 'var(--text-main)' : 'var(--text-muted)',
                borderBottom: activeTab === 'register' ? '2px solid var(--accent-burgundy)' : '2px solid transparent',
                marginBottom: '-2px',
                fontFamily: 'var(--font-heading)',
                fontWeight: '600',
                fontSize: '1.1rem',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Đăng Ký
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '6px' }}>
                Đăng Nhập Tài Khoản
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '25px' }}>
                Dành cho Khách hàng Khách sạn/Nhà hàng & Nhân viên Kinh doanh.
              </p>

              <div className="form-group">
                <label><i className="fa-solid fa-user gold-text"></i> Tên Đăng Nhập / Email</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: lotte_buyer hoặc purchasing@lottesaigon.com"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label><i className="fa-solid fa-lock gold-text"></i> Mật Khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>

              {/* REMOVED VAI TRÒ TRUY CẬP */}

              <button type="submit" className="btn-redapron-gold" style={{ width: '100%', marginTop: '10px', padding: '14px' }} disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP B2B PORTAL</>}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '6px' }}>
                Đăng Ký Khách Hàng Doanh Nghiệp
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Tạo hồ sơ mở tài khoản mua buôn & cấp hạn mức nợ Net-30.
              </p>

              <div className="form-group">
                <label>Tên Doanh Nghiệp / Công Ty *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="CÔNG TY CP KHÁCH SẠN LOTTE SAIGON..."
                  value={registerData.company_name}
                  onChange={(e) => setRegisterData({ ...registerData, company_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Mã Số Thuế *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0301234567"
                    value={registerData.tax_code}
                    onChange={(e) => setRegisterData({ ...registerData, tax_code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Loại Hình B2B</label>
                  <select
                    className="form-control"
                    value={registerData.company_type}
                    onChange={(e) => setRegisterData({ ...registerData, company_type: e.target.value })}
                  >
                    <option value="BUYER">Khách Sạn / Nhà Hàng (HORECA)</option>
                    <option value="DISTRIBUTOR">Đại Lý / Nhà Phân Phối</option>
                    <option value="CORPORATE">Doanh Nghiệp (Quà Tặng Doanh Nghiệp)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Email Liên Hệ *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="purchasing@company.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Tên Đăng Nhập *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="company_buyer"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số Giấy Phép Rượu</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="108/GP-BCT"
                    value={registerData.license_number}
                    onChange={(e) => setRegisterData({ ...registerData, license_number: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-redapron-burgundy" style={{ width: '100%', marginTop: '10px', padding: '14px' }} disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-paper-plane"></i> GỬI HỒ SƠ ĐĂNG KÝ B2B</>}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
