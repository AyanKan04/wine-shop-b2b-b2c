import React, { useState } from 'react';
import apiService from '../services/api.js';

export default function CompanyRegisterPage({ showToast }) {
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
      }
    } catch (err) {
      showToast(err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'var(--font-brand)', marginBottom: '8px' }}>
          <i className="fa-solid fa-building-shield"></i> RedApron B2B Verification
        </p>
        <h2 className="page-title" style={{ margin: 0 }}>ĐĂNG KÝ DOANH NGHIỆP & THẨM ĐỊNH PHÁP LÝ</h2>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Xác thực hồ sơ pháp lý theo Nghị định 105/2017/NĐ-CP để mở tài khoản mua sỉ & cấp hạn mức Net-30.
        </p>
      </div>

      <form className="card-box" onSubmit={handleSubmit} style={{ padding: '35px' }}>
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

        <button type="submit" className="btn-redapron-gold" style={{ width: '100%', padding: '14px', fontSize: '0.9rem' }} disabled={loading}>
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin"></i>
          ) : (
            <><i className="fa-solid fa-paper-plane"></i> GỬI HỒ SƠ ĐĂNG KÝ B2B</>
          )}
        </button>
      </form>
    </div>
  );
}
