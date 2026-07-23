import React, { useState } from 'react';

export default function CompanyRegisterPage({ showToast }) {
  const [name, setName] = useState('');
  const [tax, setTax] = useState('');
  const [license, setLicense] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Đã gửi thông tin Đăng ký Doanh nghiệp & Giấy phép Rượu! Chờ Admin phê duyệt.');
  };

  return (
    <div className="page-container" style={{ maxWidth: '700px' }}>
      <h2 className="page-title">4. ĐĂNG KÝ DOANH NGHIỆP & UPLOAD GIẤY PHÉP RƯỢU</h2>
      <p className="page-subtitle">Xác thực hồ sơ pháp lý theo Nghị định 105/2017/NĐ-CP trước khi xem bảng giá sỉ</p>

      <form className="card-box" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tên Doanh Nghiệp (Công ty / Đại lý)</label>
          <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: CÔNG TY TNHH NHÀ HÀNG KONTINENTAL" required />
        </div>

        <div className="form-group">
          <label>Mã Số Thuế (MST)</label>
          <input className="form-control" value={tax} onChange={e => setTax(e.target.value)} placeholder="0301999888" required />
        </div>

        <div className="form-group">
          <label>Số Giấy Phép Bán Buôn / Phân Phối Rượu</label>
          <input className="form-control" value={license} onChange={e => setLicense(e.target.value)} placeholder="Số 108/GP-BCT" required />
        </div>

        <div className="form-group">
          <label>Tải Lên ĐKKD & Giấy Phép Kinh Doanh Rượu (PDF / Image)</label>
          <input type="file" className="form-control" required />
        </div>

        <button type="submit" className="btn-redapron-gold" style={{ width: '100%', marginTop: '10px' }}>Gửi Hồ Sơ Phê Duyệt</button>
      </form>
    </div>
  );
}
