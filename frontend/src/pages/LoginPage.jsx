import React, { useState } from 'react';
import apiService from '../services/api.js';

export default function LoginPage({ showToast, onLoginSuccess, onNavigateRegister }) {
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    username: 'admin_platform',
    password: 'Admin@123!',
    role: 'BUYER_REP'
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

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '35px',
          minHeight: '520px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
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

            <div className="form-group">
              <label><i className="fa-solid fa-user-gear gold-text"></i> Vai Trò Truy Cập</label>
              <select
                className="form-control"
                value={loginData.role}
                onChange={(e) => setLoginData({ ...loginData, role: e.target.value })}
              >
                <option value="BUYER_REP">Khách Hàng B2B (Đại Diện Mua Hàng)</option>
                <option value="SALES_REP">Nhân Viên Sales B2B</option>
                <option value="FINANCE_OFFICER">Kế Toán & Hạn Mức Tín Dụng</option>
                <option value="WAREHOUSE_STAFF">Quản Lý Kho & Vận Chuyển</option>
                <option value="PLATFORM_ADMIN">Quản Trị Viên (Platform Admin)</option>
              </select>
            </div>

            <button type="submit" className="btn-redapron-gold" style={{ width: '100%', marginTop: '20px', padding: '14px', background: '#111111', color: '#FFFFFF', border: '1px solid #111111' }} disabled={loading}>
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP PORTAL</>}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chưa có tài khoản sỉ doanh nghiệp? </span>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (onNavigateRegister) onNavigateRegister(); }}
                style={{ color: 'var(--accent-gold)', fontWeight: '600', textDecoration: 'none' }}
              >
                Đăng ký B2B ngay
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
