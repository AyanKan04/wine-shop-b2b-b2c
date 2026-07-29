import React, { useState } from 'react';
import apiService from '../services/api.js';

export default function CompanyRegisterPage({ showToast, onNavigateLogin }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    tax_code: '',
    email: '',
    username: '',
    password: '',
    company_type: 'BUYER',
    license_number: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name || !formData.tax_code || !formData.email) {
      showToast('Vui lòng điền đầy đủ Tên Công Ty, Mã Số Thuế và Email!');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.register(formData);
      if (res.success) {
        showToast('Đăng ký doanh nghiệp thành công! Đã gửi hồ sơ cấp hạn mức sỉ B2B.');
        setFormData({
          company_name: '',
          tax_code: '',
          email: '',
          username: '',
          password: '',
          company_type: 'BUYER',
          license_number: ''
        });
        if (onNavigateLogin) onNavigateLogin();
      }
    } catch (err) {
      showToast(err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: BRAND PROMO / B2B TRUST STRIP */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '620px'
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
              Thẩm Định Pháp Lý & Cấp Hạn Mức
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.4rem',
              lineHeight: '1.2',
              marginBottom: '20px'
            }}>
              Đăng Ký Tài Khoản <span className="gold-gradient-text">Mua Sỉ Doanh Nghiệp</span>
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '35px', lineHeight: '1.7' }}>
              Xác thực hồ sơ doanh nghiệp tuân thủ theo Nghị định 105/2017/NĐ-CP về kinh doanh rượu nhập khẩu chính ngạch.
            </p>

            {/* TRUST HIGHLIGHTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-file-shield"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Thẩm Định Hồ Sơ Chặt Chẽ</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cấp tài khoản sỉ chính thức sau khi xác thực giấy phép ĐKKD.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-percent"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Mở Khóa Bảng Giá Chiết Khấu Sỉ</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Xem bảng giá sỉ 5 tầng và tạo yêu cầu đàm phán RFQ trực tuyến.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-wallet"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Kích Hoạt Thanh Toán Net-30</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hỗ trợ bảo lãnh ngân hàng L/C để gia tăng hạn mức nợ trả sau.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span><i className="fa-solid fa-shield-halved gold-text"></i> Tuân thủ Nghị định 105/2017/NĐ-CP</span>
            <span>Hotline B2B: 1900 633 349</span>
          </div>
        </div>

        {/* RIGHT COLUMN: REGISTER FORM */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '35px',
          minHeight: '620px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '6px' }}>
              Đăng Ký Khách Hàng Doanh Nghiệp
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Tạo hồ sơ mở tài khoản mua buôn & cấp hạn mức nợ Net-30.
            </p>

            <div className="form-group">
              <label>Tên Doanh Nghiệp (Khách sạn / Nhà hàng / Đại lý) *</label>
              <input
                className="form-control"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="CÔNG TY CP KHÁCH SẠN LOTTE SAIGON..."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Mã Số Thuế (MST) *</label>
                <input
                  className="form-control"
                  value={formData.tax_code}
                  onChange={e => setFormData({ ...formData, tax_code: e.target.value })}
                  placeholder="0301234567"
                  required
                />
              </div>
              <div className="form-group">
                <label>Loại Hình B2B</label>
                <select
                  className="form-control"
                  value={formData.company_type}
                  onChange={e => setFormData({ ...formData, company_type: e.target.value })}
                >
                  <option value="BUYER">Khách Sạn / Nhà Hàng (HORECA)</option>
                  <option value="DISTRIBUTOR">Đại Lý / Nhà Phân Phối</option>
                  <option value="CORPORATE">Doanh Nghiệp (Quà Tặng)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Email Liên Hệ *</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="purchasing@lottesaigon.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Tên Đăng Nhập Tài Khoản *</label>
                <input
                  className="form-control"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="lotte_buyer"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật Khẩu *</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Số Giấy Phép Bán Buôn / Phân Phối Rượu (Nếu có)</label>
              <input
                className="form-control"
                value={formData.license_number}
                onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="Số 108/GP-BCT"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label>Tải Lên Bản Sao ĐKKD & Giấy Phép Rượu (PDF / Image) *</label>
              <input type="file" className="form-control" required />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Định dạng cho phép: PDF, PNG, JPG (Tối đa 10MB).
              </span>
            </div>

            <button type="submit" className="btn-redapron-burgundy" style={{ width: '100%', padding: '14px', fontSize: '0.9rem' }} disabled={loading}>
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <><i className="fa-solid fa-paper-plane"></i> GỬI HỒ SƠ ĐĂNG KÝ B2B</>
              )}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Đã có tài khoản doanh nghiệp sỉ? </span>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (onNavigateLogin) onNavigateLogin(); }}
                style={{ color: 'var(--accent-burgundy)', fontWeight: '600', textDecoration: 'none' }}
              >
                Đăng nhập ngay
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
