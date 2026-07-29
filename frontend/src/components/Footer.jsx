import React from 'react';

export default function Footer() {
  return (
    <footer>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: '40px', marginBottom: '40px' }}>
        {/* BRAND COLUMN */}
        <div>
          <h3 className="gold-gradient-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', marginBottom: '15px' }}>RED APRON FINE WINES</h3>
          <p style={{ lineHeight: 1.7, marginBottom: '15px' }}>Nhà nhập khẩu và phân phối rượu vang & đồ uống có cồn B2B cao cấp hàng đầu Việt Nam.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['fa-facebook-f', 'fa-linkedin-in', 'fa-instagram'].map((icon, i) => (
              <a key={i} href="#" style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(212,175,55,0.1)', border: '1px solid var(--border-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-gold)', fontSize: '0.8rem', textDecoration: 'none',
                transition: 'all 0.2s'
              }}>
                <i className={`fa-brands ${icon}`}></i>
              </a>
            ))}
          </div>
        </div>

        {/* BUYER COLUMN */}
        <div>
          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px', fontSize: '0.8rem', letterSpacing: '1px' }}>KHÁCH HÀNG (BUYER)</h4>
          <p style={{ marginBottom: '6px' }}>• Catalog & Lọc Sản phẩm</p>
          <p style={{ marginBottom: '6px' }}>• Quy trình Đàm phán RFQ</p>
          <p style={{ marginBottom: '6px' }}>• Hạn mức Tín dụng Net-30</p>
          <p style={{ marginBottom: '6px' }}>• Đăng ký Doanh nghiệp B2B</p>
        </div>

        {/* ADMIN COLUMN */}
        <div>
          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px', fontSize: '0.8rem', letterSpacing: '1px' }}>QUẢN TRỊ (STAFF)</h4>
          <p style={{ marginBottom: '6px' }}>• Duyệt Giấy phép Rượu Admin</p>
          <p style={{ marginBottom: '6px' }}>• Cấu hình Bậc giá Tier 1-5</p>
          <p style={{ marginBottom: '6px' }}>• Xuất kho & Vận chuyển</p>
          <p style={{ marginBottom: '6px' }}>• CRM Kanban Pipeline</p>
        </div>

        {/* PROJECT INFO */}
        <div>
          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px', fontSize: '0.8rem', letterSpacing: '1px' }}>DỰ ÁN MÔN TMĐT</h4>
          <p style={{ marginBottom: '6px' }}>Nhóm 07 - Đồ án TMĐT</p>
          <p style={{ marginBottom: '6px' }}>GVHD: TS. Đỗ Đức Bích Ngân</p>
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--accent-gold)', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--border-gold)', padding: '4px 10px', borderRadius: '12px' }}>
              <i className="fa-solid fa-shield-halved"></i> NĐ 105/2017/NĐ-CP Compliant
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '12px' }}>
              <i className="fa-solid fa-phone"></i> Hotline: 1900 633 349
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
        © 2026 RedApron RuuBusiness B2B Platform. Modular ReactJS + Node.js REST API + PostgreSQL. Tất cả quyền được bảo lưu.
      </div>
    </footer>
  );
}
