import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function IAMAccountMgmtPage({ showToast }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    user_type: 'BUYER_REP',
    first_name: '',
    last_name: '',
    company_id: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiService.getUsers(search);
      if (res.success) {
        setUsers(res.data || []);
      } else {
        showToast('API trả về lỗi: ' + (res.message || 'Không rõ'));
      }
    } catch (err) {
      const errMsg = err.message || 'Lỗi không xác định';
      showToast('Lỗi kết nối API: ' + errMsg);
      console.error('[IAM] fetchUsers error:', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiService.createUser(formData);
      if (res.success) {
        showToast('Tạo tài khoản thành công!');
        setShowModal(false);
        fetchUsers();
        setFormData({ username: '', email: '', password: '', user_type: 'BUYER_REP', first_name: '', last_name: '', company_id: '' });
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo tài khoản');
    }
  };

  const handleEditClick = (user) => {
    setFormData({
      username: user.Username, // Disabled in edit mode
      email: user.Email,       // Disabled in edit mode
      first_name: user.FirstName || '',
      last_name: user.LastName || '',
      user_type: user.UserType,
      status: user.Status
    });
    setEditUserId(user.UserID);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiService.updateUser(editUserId, formData);
      if (res.success) {
        showToast('Cập nhật tài khoản thành công!');
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật tài khoản');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không? (Hành động này sẽ ẩn tài khoản khỏi hệ thống)')) return;
    try {
      const res = await apiService.deleteUser(id);
      if (res.success) {
        showToast('Đã xóa tài khoản thành công!');
        fetchUsers();
      }
    } catch (err) {
      showToast('Lỗi khi xóa tài khoản');
    }
  };

  const handleLock = async (id, currentStatus) => {
    const action = currentStatus === 'LOCKED' ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này không?`)) return;
    try {
      const res = await apiService.lockUser(id);
      if (res.success) {
        showToast(`Đã ${action} tài khoản!`);
        fetchUsers();
      }
    } catch (err) {
      showToast(`Lỗi khi ${action} tài khoản`);
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Tên Đăng Nhập', 'Email', 'Họ Tên', 'Doanh Nghiệp', 'Vai Trò', 'Trạng Thái'];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + users.map(u => `${u.UserID},${u.Username},${u.Email},"${u.FirstName||''} ${u.LastName||''}", "${u.CompanyName || ''}",${u.UserType},${u.Status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "danh_sach_tai_khoan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: '#FFF' }}>
            <i className="fa-solid fa-users-gear gold-text"></i> Quản Lý Tài Khoản (IAM & RBAC)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phân quyền và quản lý tài khoản người dùng hệ thống.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn-redapron-burgundy" onClick={handleExport}>
            <i className="fa-solid fa-file-export"></i> Xuất Danh Sách
          </button>
          <input 
            type="text" 
            placeholder="Tìm theo Username, Email..." 
            className="form-control" 
            style={{ width: '250px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-redapron-gold" onClick={() => {
            setFormData({ username: '', email: '', password: '', user_type: 'BUYER_REP', first_name: '', last_name: '', company_id: '' });
            setShowModal(true);
          }}>
            + Thêm User
          </button>
        </div>
      </div>

      {/* MODAL: CREATE ACCOUNT */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ marginTop: 0, color: 'var(--accent-gold)' }}>Thêm Tài Khoản Mới</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Username *</label>
                <input className="form-control" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" className="form-control" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" className="form-control" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group"><label>Tên</label><input className="form-control" value={formData.first_name} onChange={e=>setFormData({...formData, first_name: e.target.value})} /></div>
                <div className="form-group"><label>Họ</label><input className="form-control" value={formData.last_name} onChange={e=>setFormData({...formData, last_name: e.target.value})} /></div>
              </div>
              <div className="form-group">
                <label>Vai Trò (Role) *</label>
                <select className="form-control" value={formData.user_type} onChange={e=>setFormData({...formData, user_type: e.target.value})}>
                  <option value="BUYER_REP">BUYER_REP</option>
                  <option value="SALES_REP">SALES_REP</option>
                  <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                  <option value="FINANCE_OFFICER">FINANCE_OFFICER</option>
                  <option value="WAREHOUSE_STAFF">WAREHOUSE_STAFF</option>
                  <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-redapron-gold">Tạo Tài Khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ACCOUNT */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ marginTop: 0, color: 'var(--accent-gold)' }}>Sửa Thông Tin Tài Khoản</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input className="form-control" value={formData.username} disabled style={{ opacity: 0.5 }} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={formData.email} disabled style={{ opacity: 0.5 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group"><label>Tên</label><input className="form-control" value={formData.first_name} onChange={e=>setFormData({...formData, first_name: e.target.value})} /></div>
                <div className="form-group"><label>Họ</label><input className="form-control" value={formData.last_name} onChange={e=>setFormData({...formData, last_name: e.target.value})} /></div>
              </div>
              <div className="form-group">
                <label>Vai Trò (Role) *</label>
                <select className="form-control" value={formData.user_type} onChange={e=>setFormData({...formData, user_type: e.target.value})}>
                  <option value="BUYER_REP">BUYER_REP</option>
                  <option value="SALES_REP">SALES_REP</option>
                  <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                  <option value="FINANCE_OFFICER">FINANCE_OFFICER</option>
                  <option value="WAREHOUSE_STAFF">WAREHOUSE_STAFF</option>
                  <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trạng Thái *</label>
                <select className="form-control" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="LOCKED">Khóa</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className="btn-redapron-gold">Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên Đăng Nhập</th>
            <th>Email</th>
            <th>Họ Tên</th>
            <th>Doanh Nghiệp</th>
            <th>Vai Trò (Role)</th>
            <th>Trạng Thái</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="8" style={{textAlign:'center', padding:'30px', color: 'var(--text-muted)'}}>⏳ Đang tải danh sách tài khoản...</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan="8" style={{textAlign:'center', padding:'30px', color: '#EF4444'}}>⚠️ Không tìm thấy tài khoản nào. Kiểm tra kết nối backend (localhost:5000) hoặc thử F5 lại trang.</td></tr>
          ) : (
           users.map(u => (
            <tr key={u.UserID}>
              <td>#{u.UserID}</td>
              <td style={{ fontWeight: '600' }}>{u.Username}</td>
              <td>{u.Email}</td>
              <td>{u.FirstName} {u.LastName}</td>
              <td style={{ color: 'var(--accent-gold)' }}>{u.CompanyName || 'N/A'}</td>
              <td>{u.UserType}</td>
              <td>
                {u.Status === 'ACTIVE' ? <span style={{ color: '#10B981' }}>Hoạt động</span> : <span style={{ color: '#EF4444' }}>Đã khóa</span>}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => {
                    handleEditClick(u);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} style={{ background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--accent-gold)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Sửa</button>
                  <button onClick={() => handleLock(u.UserID, u.Status)} style={{ background: 'transparent', border: '1px solid #F59E0B', color: '#F59E0B', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                    {u.Status === 'LOCKED' ? 'Mở Khóa' : 'Khóa'}
                  </button>
                  <button onClick={() => handleDelete(u.UserID)} style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
                </div>
              </td>
            </tr>
          )))}

        </tbody>
      </table>


    </div>
  );
}
