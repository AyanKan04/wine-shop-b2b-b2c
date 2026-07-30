import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function AdminDashboardPage({ showToast }) {
  const [activeTab, setActiveTab] = useState('licenses'); // 'licenses' | 'companies' | 'products' | 'credit' | 'audit'

  const [licensesList, setLicensesList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    company_name: '',
    tax_code: '',
    company_type: 'BUYER'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [licRes, compRes, auditRes] = await Promise.all([
        apiService.getAdminLicenses().catch(() => ({ success: false })),
        apiService.getCompanies().catch(() => ({ success: false })),
        apiService.getAuditLogs ? apiService.getAuditLogs().catch(() => ({ success: false })) : Promise.resolve({ success: false })
      ]);

      if (licRes.success) setLicensesList(licRes.data);
      if (compRes.success) setCompaniesList(compRes.data);
      if (auditRes && auditRes.success) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải dữ liệu Quản trị');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleApproveLicense = async (licenseId) => {
    try {
      await apiService.approveLicense(licenseId);
      showToast('Đã phê duyệt Giấy phép Bán buôn Rượu thành công!');
      fetchData();
    } catch (err) {
      showToast('Lỗi khi phê duyệt giấy phép!');
    }
  };

  const handleRejectLicense = async (licenseId) => {
    try {
      const res = await apiService.rejectLicense(licenseId);
      if (res.success) {
        showToast('Đã từ chối Hồ sơ Giấy phép!');
        fetchData();
      }
    } catch (err) {
      showToast('Lỗi khi từ chối giấy phép!');
    }
  };

  const toggleCompanyStatus = async (companyId) => {
    try {
      const res = await apiService.toggleCompanyStatus(companyId);
      if (res.success) {
        showToast(`Đã thay đổi trạng thái doanh nghiệp`);
        fetchData();
      }
    } catch (err) {
      showToast('Lỗi thay đổi trạng thái');
    }
  };

  const handleAddCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiService.registerCompany(companyFormData);
      if (res.success) {
        showToast('Tạo tài khoản và doanh nghiệp thành công!');
        setShowAddCompanyModal(false);
        setCompanyFormData({
          username: '', password: '', email: '', first_name: '', last_name: '',
          company_name: '', tax_code: '', company_type: 'BUYER'
        });
        fetchData();
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo doanh nghiệp');
    }
  };

  const formatVND = (val) => val.toLocaleString('vi-VN') + ' ₫';

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {loading && <div style={{ color: '#FFF', padding: '10px' }}>Đang tải dữ liệu...</div>}

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
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '8px' }}>
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
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '8px' }}>
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
          <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }}></i> Nhật Ký Tuân Thủ (Audit)
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
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{lic.company_name}</div>
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
                    {lic.status === 'VERIFIED' && <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>Đã Phê Duyệt</span>}
                    {lic.status === 'PENDING_VERIFICATION' && <span style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>Chờ Thẩm Định</span>}
                    {lic.status === 'REJECTED' && <span style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>Từ Chiếu</span>}
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
            <button className="btn-redapron-gold" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={() => setShowAddCompanyModal(true)}>
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
                  <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{comp.company_name}</td>
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
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '6px' }}>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Quy Tắc Tự Động Khóa Đơn Hàng</h4>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Khóa thanh toán Net-30 khi Tổng Dư Nợ vượt $\ge 100\%$ Hạn mức tín dụng được duyệt.</li>
                <li>Tự động chuyển trạng thái sang <strong>Pre-payment (Trả trước)</strong> nếu có hóa đơn quá hạn quá 30 ngày.</li>
                <li>Gửi cảnh báo Email tự động cho Kế toán doanh nghiệp trước 5 ngày đến hạn.</li>
              </ul>
            </div>

            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '6px' }}>
              <h4 style={{ color: '#346538', marginBottom: '10px' }}>Thống Kê Thanh Toán</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                <span>Tổng Hóa Đơn Đã Phát Hành:</span>
                <strong>₫1,250,000,000</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                <span>Hóa Đơn Đã Thanh Toán:</span>
                <strong style={{ color: '#346538' }}>₫900,000,000 (72%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Nợ Chưa Thanh Toán:</span>
                <strong style={{ color: '#B25E00' }}>₫350,000,000 (28%)</strong>
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

      {/* FIXED OVERLAY MODAL: ADD COMPANY */}
      {showAddCompanyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: 'var(--accent-gold)' }}>Cấp Mới Đối Tác B2B</h3>
              <button onClick={() => setShowAddCompanyModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddCompanySubmit}>
              <h4 style={{ color: '#FFF', borderBottom: '1px solid var(--border-gold)', paddingBottom: '10px' }}>1. Thông Tin Doanh Nghiệp</h4>
              <div className="form-group">
                <label>Tên Doanh Nghiệp</label>
                <input type="text" className="form-control" required value={companyFormData.company_name} onChange={e => setCompanyFormData({...companyFormData, company_name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mã Số Thuế</label>
                  <input type="text" className="form-control" required value={companyFormData.tax_code} onChange={e => setCompanyFormData({...companyFormData, tax_code: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Phân Loại (Vai Trò)</label>
                  <select className="form-control" value={companyFormData.company_type} onChange={e => setCompanyFormData({...companyFormData, company_type: e.target.value})}>
                    <option value="BUYER">BUYER (Khách Mua Sỉ)</option>
                    <option value="SELLER">SELLER (Nhà Phân Phối)</option>
                  </select>
                </div>
              </div>

              <h4 style={{ color: '#FFF', borderBottom: '1px solid var(--border-gold)', paddingBottom: '10px', marginTop: '20px' }}>2. Tài Khoản Quản Trị (Company Admin)</h4>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tên Đăng Nhập</label>
                  <input type="text" className="form-control" required value={companyFormData.username} onChange={e => setCompanyFormData({...companyFormData, username: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mật Khẩu</label>
                  <input type="password" className="form-control" required value={companyFormData.password} onChange={e => setCompanyFormData({...companyFormData, password: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Email Trụ Sở</label>
                <input type="email" className="form-control" required value={companyFormData.email} onChange={e => setCompanyFormData({...companyFormData, email: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Họ (Last Name)</label>
                  <input type="text" className="form-control" value={companyFormData.last_name} onChange={e => setCompanyFormData({...companyFormData, last_name: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tên (First Name)</label>
                  <input type="text" className="form-control" value={companyFormData.first_name} onChange={e => setCompanyFormData({...companyFormData, first_name: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                <button type="button" onClick={() => setShowAddCompanyModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--accent-burgundy)' }}>
                  Hủy
                </button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 25px' }}>
                  Lưu & Cấp Quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
