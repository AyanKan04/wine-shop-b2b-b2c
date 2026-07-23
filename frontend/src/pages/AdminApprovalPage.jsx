import React from 'react';

export default function AdminApprovalPage({ licenses, showToast }) {
  return (
    <div className="page-container">
      <h2 className="page-title burgundy-text">7. PLATFORM ADMIN: DUYỆT DOANH NGHIỆP & GIẤY PHÉP RƯỢU</h2>
      <p className="page-subtitle">Kiểm tra tính hợp lệ và thời hạn hiệu lực của Giấy phép kinh doanh rượu trước khi kích hoạt tài khoản</p>

      <div className="card-box">
        <table className="data-table">
          <thead>
            <tr><th>MÃ DOANH NGHIỆP</th><th>LOẠI GIẤY PHÉP</th><th>SỐ GIẤY PHÉP</th><th>HẠN HIỆU LỰC</th><th>TRẠNG THÁI</th><th>HÀNH ĐỘNG</th></tr>
          </thead>
          <tbody>
            {licenses.map(l => (
              <tr key={l.license_id}>
                <td>Company #{l.company_id}</td>
                <td>{l.license_type || 'Giấy phép Bán buôn Rượu'}</td>
                <td>{l.license_number}</td>
                <td>{l.expiry_date || '2027-03-14'}</td>
                <td>
                  <span style={{ color: l.status === 'VERIFIED' ? '#2EB85C' : '#F9B115', border: `1px solid ${l.status === 'VERIFIED' ? '#2EB85C' : '#F9B115'}`, padding: '2px 8px', borderRadius: '3px', fontSize: '0.7rem' }}>
                    {l.status}
                  </span>
                </td>
                <td>
                  {l.status !== 'VERIFIED' && (
                    <button className="btn-redapron-gold" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => showToast(`Đã phê duyệt Giấy phép Rượu cho Company #${l.company_id}!`)}>Phê Duyệt Mở Tài Khoản</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
