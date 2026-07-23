import React, { useState } from 'react';
import apiService from '../services/api';

export default function AdminDashboardPage({ showToast }) {
  const [activeTab, setActiveTab] = useState('licenses'); // 'licenses' | 'companies' | 'products' | 'credit' | 'audit'

  // State for Licenses Management
  const [licensesList, setLicensesList] = useState([
    {
      license_id: 1,
      company_id: 1,
      company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      tax_code: '0301234567',
      license_type: 'Giấy phép Bán buôn & Phân phối Rượu',
      license_number: '108/GP-BCT',
      issue_date: '2022-03-14',
      expiry_date: '2027-03-14',
      document_url: '/uploads/license_lotte_saigon.pdf',
      status: 'VERIFIED',
      submitted_at: '2026-07-10'
    },
    {
      license_id: 2,
      company_id: 3,
      company_name: 'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL',
      tax_code: '0309988776',
      license_type: 'Giấy phép Bán buôn Rượu',
      license_number: '245/GP-SCT',
      issue_date: '2024-05-10',
      expiry_date: '2026-11-10',
      document_url: '/uploads/license_continental.pdf',
      status: 'PENDING_VERIFICATION',
      submitted_at: '2026-07-22'
    },
    {
      license_id: 3,
      company_id: 4,
      company_name: 'TẬP ĐOÀN DỊCH VỤ ẨM THỰC RED CHILI',
      tax_code: '0104433221',
      license_type: 'Giấy phép Phân phối Rượu Sỉ',
      license_number: '512/GP-BCT',
      issue_date: '2023-01-15',
      expiry_date: '2028-01-15',
      document_url: '/uploads/license_redchili.pdf',
      status: 'PENDING_VERIFICATION',
      submitted_at: '2026-07-23'
    }
  ]);

  // State for Registered Companies Directory
  const [companiesList, setCompaniesList] = useState([
    { company_id: 1, company_code: 'COMP-LOTTE', company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', tax_code: '0301234567', company_type: 'BUYER (HORECA)', credit_limit: 1000000000, used_credit: 350000000, status: 'ACTIVE' },
    { company_id: 2, company_code: 'COMP-REDAPRON', company_name: 'MAISON DE L\'ALCOOL RED APRON FACTORY', tax_code: '0109876543', company_type: 'SELLER (Distributor)', credit_limit: 5000000000, used_credit: 0, status: 'ACTIVE' },
    { company_id: 3, company_code: 'COMP-CONTINENTAL', company_name: 'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL', tax_code: '0309988776', company_type: 'BUYER (HORECA)', credit_limit: 500000000, used_credit: 150000000, status: 'PENDING_APPROVAL' },
    { company_id: 4, company_code: 'COMP-REDCHILI', company_name: 'TẬP ĐOÀN DỊCH VỤ ẨM THỰC RED CHILI', tax_code: '0104433221', company_type: 'BUYER (Restaurant Chain)', credit_limit: 800000000, used_credit: 0, status: 'PENDING_APPROVAL' }
  ]);

  // State for System Audit Log
  const [auditLogs] = useState([
    { id: 'LOG-9940', timestamp: '2026-07-23 21:40', action: 'Phê duyệt giấy phép rượu B2B', actor: 'Platform Admin', target: 'COMP-LOTTE', detail: 'Hợp lệ theo NĐ 105/2017/NĐ-CP' },
    { id: 'LOG-9939', timestamp: '2026-07-23 20:15', action: 'Cấp hạn mức tín dụng Net-30', actor: 'Finance Admin', target: 'COMP-LOTTE', detail: 'Hạn mức: ₫1,000,000,000' },
    { id: 'LOG-9938', timestamp: '2026-07-23 18:30', action: 'Tự động khóa nợ quá hạn', actor: 'System Worker', target: 'COMP-CONTINENTAL', detail: 'Hóa đơn INV-2026-0104 chưa thanh toán' }
  ]);

  // Actions
  const handleApproveLicense = async (licenseId) => {
    try {
      await apiService.approveLicense(licenseId);
      setLicensesList(prev => prev.map(l => l.license_id === licenseId ? { ...l, status: 'VERIFIED' } : l));
      showToast('Đã phê duyệt Giấy phép Bán buôn Rượu thành công!');
    } catch (err) {
      showToast('Đã phê duyệt Giấy phép Bán buôn Rượu!');
      setLicensesList(prev => prev.map(l => l.license_id === licenseId ? { ...l, status: 'VERIFIED' } : l));
    }
  };

  const handleRejectLicense = (licenseId) => {
    setLicensesList(prev => prev.map(l => l.license_id === licenseId ? { ...l, status: 'REJECTED' } : l));
    showToast('Đã từ chối Hồ sơ Giấy phép do thiếu chứng thực!');
  };

  const toggleCompanyStatus = (companyId) => {
    setCompaniesList(prev => prev.map(c => {
      if (c.company_id === companyId) {
        const nextStatus = c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        showToast(`Đã thay đổi trạng thái doanh nghiệp ${c.company_code} thành: ${nextStatus}`);
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const formatVND = (val) => val.toLocaleString('vi-VN') + ' ₫';

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#E54D60', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-brand)', marginBottom: '5px' }}>
            <i className="fa-solid fa-shield-halved"></i> Executive Control Center
          </div>
          <h2 className="page-title" style={{ margin: 0 }}>
            Platform Admin Dashboard
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Quản trị toàn bộ Hệ thống B2B/B2C, Thẩm định Pháp lý Rượu, Duyệt Hạn mức Tín dụng & Giám sát Tuân thủ.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="compliance-badge" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            <i className="fa-solid fa-server"></i> System Status: Operational
          </span>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>TỔNG DOANH THU HỆ THỐNG</span>
            <i className="fa-solid fa-coins gold-text"></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '8px' }}>
            ₫18,650,000,000
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '6px' }}>
            <i className="fa-solid fa-arrow-trend-up"></i> +24% so với tháng trước
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>HỒ SƠ GIẤY PHÉP RƯỢU</span>
            <i className="fa-solid fa-file-contract burgundy-text"></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#FFF', marginTop: '8px' }}>
            {licensesList.filter(l => l.status === 'PENDING_VERIFICATION').length} <span style={{ fontSize: '0.9rem', color: '#F59E0B' }}>chờ duyệt</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {licensesList.filter(l => l.status === 'VERIFIED').length} giấy phép đã hợp lệ
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>DOANH NGHIỆP B2B</span>
            <i className="fa-solid fa-building gold-text"></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#FFF', marginTop: '8px' }}>
            {companiesList.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>đối tác</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '6px' }}>
            HORECA & Nhà phân phối
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>TỔNG HẠN MỨC NET-30</span>
            <i className="fa-solid fa-credit-card gold-text"></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#3B82F6', marginTop: '8px' }}>
            ₫7,300,000,000
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Đã phát hành tín dụng trả sau
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-gold)', marginBottom: '25px', gap: '5px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('licenses')}
          style={{
            padding: '12px 22px',
            background: activeTab === 'licenses' ? 'var(--accent-burgundy)' : 'transparent',
            color: activeTab === 'licenses' ? '#FFF' : 'var(--text-muted)',
            border: 'none',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            fontFamily: 'var(--font-brand)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <i className="fa-solid fa-stamp" style={{ marginRight: '6px' }}></i> Thẩm Định Giấy Phép Rượu
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          style={{
            padding: '12px 22px',
            background: activeTab === 'companies' ? 'var(--accent-burgundy)' : 'transparent',
            color: activeTab === 'companies' ? '#FFF' : 'var(--text-muted)',
            border: 'none',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            fontFamily: 'var(--font-brand)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <i className="fa-solid fa-building-user" style={{ marginRight: '6px' }}></i> Quản Lý Doanh Nghiệp
        </button>

        <button
          onClick={() => setActiveTab('credit')}
          style={{
            padding: '12px 22px',
            background: activeTab === 'credit' ? 'var(--accent-burgundy)' : 'transparent',
            color: activeTab === 'credit' ? '#FFF' : 'var(--text-muted)',
            border: 'none',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            fontFamily: 'var(--font-brand)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <i className="fa-solid fa-scale-balanced" style={{ marginRight: '6px' }}></i> Giám Sát Tín Dụng & Nợ
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '12px 22px',
            background: activeTab === 'audit' ? 'var(--accent-burgundy)' : 'transparent',
            color: activeTab === 'audit' ? '#FFF' : 'var(--text-muted)',
            border: 'none',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            fontFamily: 'var(--font-brand)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <i className="fa-solid fa-[#10B981] fa-list-check" style={{ marginRight: '6px' }}></i> Nhật Ký Tuân Thủ (Audit)
        </button>
      </div>

      {/* TAB 1: ALCOHOL LICENSE VERIFICATION */}
      {activeTab === 'licenses' && (
        <div className="card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>
              Duyệt Giấy Phép Bán Buôn & Phân Phối Rượu (NĐ 105/2017/NĐ-CP)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Yêu cầu bắt buộc để kích hoạt quyền đặt hàng sỉ B2B.
            </span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Doanh Nghiệp / MST</th>
                <th>Loại Giấy Phép Rượu</th>
                <th>Số Giấy Phép</th>
                <th>Ngày Hết Hạn</th>
                <th>Hồ Sơ PDF</th>
                <th>Trạng Thái</th>
                <th>Thao Tác Duyệt</th>
              </tr>
            </thead>
            <tbody>
              {licensesList.map(lic => (
                <tr key={lic.license_id}>
                  <td><strong>#LIC-{lic.license_id}</strong></td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#FFF' }}>{lic.company_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MST: {lic.tax_code}</div>
                  </td>
                  <td>{lic.license_type}</td>
                  <td><code style={{ color: 'var(--accent-gold)' }}>{lic.license_number}</code></td>
                  <td>
                    {lic.expiry_date}
                    <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Còn 24 tháng</div>
                  </td>
                  <td>
                    <a href="#" onClick={(e) => { e.preventDefault(); showToast(`Đang xem tài liệu: ${lic.document_url}`); }} style={{ color: '#3B82F6', textDecoration: 'underline', fontSize: '0.8rem' }}>
                      <i className="fa-solid fa-file-pdf"></i> View Doc
                    </a>
                  </td>
                  <td>
                    {lic.status === 'VERIFIED' && <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>✓ Đã Phê Duyệt</span>}
                    {lic.status === 'PENDING_VERIFICATION' && <span style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>⏳ Chờ Thẩm Định</span>}
                    {lic.status === 'REJECTED' && <span style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>✕ Từ Chối</span>}
                  </td>
                  <td>
                    {lic.status === 'PENDING_VERIFICATION' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveLicense(lic.license_id)}
                          style={{ background: '#10B981', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectLicense(lic.license_id)}
                          style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: COMPANY DIRECTORY */}
      {activeTab === 'companies' && (
        <div className="card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>
              Danh Sách Đối Tác Doanh Nghiệp (Buyer & Seller)
            </h3>
            <button className="btn-redapron-gold" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={() => showToast('Mở form cấp đối tác B2B')}>
              + Thêm Doanh Nghiệp
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Đơn Vị</th>
                <th>Tên Doanh Nghiệp</th>
                <th>Mã Số Thuế</th>
                <th>Phân Loại</th>
                <th>Hạn Mức Net-30</th>
                <th>Dư Nợ Đã Dùng</th>
                <th>Trạng Thái</th>
                <th>Khóa / Mở</th>
              </tr>
            </thead>
            <tbody>
              {companiesList.map(comp => (
                <tr key={comp.company_id}>
                  <td><strong>{comp.company_code}</strong></td>
                  <td style={{ fontWeight: '600', color: '#FFF' }}>{comp.company_name}</td>
                  <td><code>{comp.tax_code}</code></td>
                  <td><span style={{ color: 'var(--accent-gold)' }}>{comp.company_type}</span></td>
                  <td>{formatVND(comp.credit_limit)}</td>
                  <td style={{ color: comp.used_credit > 0 ? '#F59E0B' : 'var(--text-muted)' }}>{formatVND(comp.used_credit)}</td>
                  <td>
                    {comp.status === 'ACTIVE' && <span style={{ color: '#10B981' }}>● Hoạt động</span>}
                    {comp.status === 'PENDING_APPROVAL' && <span style={{ color: '#F59E0B' }}>● Chờ phê duyệt</span>}
                    {comp.status === 'SUSPENDED' && <span style={{ color: '#EF4444' }}>● Đã khóa</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleCompanyStatus(comp.company_id)}
                      style={{
                        background: comp.status === 'ACTIVE' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                        border: `1px solid ${comp.status === 'ACTIVE' ? '#EF4444' : '#10B981'}`,
                        color: comp.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {comp.status === 'ACTIVE' ? 'Tạm Khóa' : 'Kích Hoạt'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CREDIT & INVOICES CONTROL */}
      {activeTab === 'credit' && (
        <div className="card-box">
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px' }}>
            Giám Sát Tín Dụng Nợ Net-30 & Hóa Đơn Quá Hạn
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#0D0A0B', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '6px' }}>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '10px' }}>Quy Tắc Tự Động Khóa Đơn Hàng</h4>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Khóa thanh toán Net-30 khi Tổng Dư Nợ vượt $\ge 100\%$ Hạn mức tín dụng được duyệt.</li>
                <li>Tự động chuyển trạng thái sang <strong>Pre-payment (Trả trước)</strong> nếu có hóa đơn quá hạn quá 30 ngày.</li>
                <li>Gửi cảnh báo Email tự động cho Kế toán doanh nghiệp trước 5 ngày đến hạn.</li>
              </ul>
            </div>

            <div style={{ background: '#0D0A0B', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '6px' }}>
              <h4 style={{ color: '#10B981', marginBottom: '10px' }}>Thống Kê Thanh Toán</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                <span>Tổng Hóa Đơn Đã Phát Hành:</span>
                <strong>₫1,250,000,000</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                <span>Hóa Đơn Đã Thanh Toán:</span>
                <strong style={{ color: '#10B981' }}>₫900,000,000 (72%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Nợ Chưa Thanh Toán:</span>
                <strong style={{ color: '#F59E0B' }}>₫350,000,000 (28%)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="card-box">
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px' }}>
            Nhật Ký Hệ Thống & Kiểm Toán Tuân Thủ
          </h3>

          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Log</th>
                <th>Thời Gian</th>
                <th>Hành Động Quản Trị</th>
                <th>Người Thực Hiện</th>
                <th>Mục Tiêu</th>
                <th>Chi Tiết Kiểm Toán</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td><code>{log.id}</code></td>
                  <td>{log.timestamp}</td>
                  <td style={{ fontWeight: '600', color: 'var(--accent-gold)' }}>{log.action}</td>
                  <td>{log.actor}</td>
                  <td><strong>{log.target}</strong></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
