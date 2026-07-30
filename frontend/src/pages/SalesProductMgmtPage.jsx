import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function SalesProductMgmtPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);

  const [formData, setFormData] = useState({
    sku: '', product_name: '', category: 'Wine / Red', country_of_origin: '', 
    region: '', grape_variety: '', vintage_year: '', alcohol_content: '', 
    volume_ml: 750, moq: 1, description: '', image_url: ''
  });

  const [priceType, setPriceType] = useState('ORIGINAL'); // ORIGINAL, TIER, CUSTOMER, CONTRACT
  const [tierPrices, setTierPrices] = useState([
    { tier_level: 1, min_quantity: 1, price_per_unit: '' },
    { tier_level: 2, min_quantity: 6, price_per_unit: '' },
    { tier_level: 3, min_quantity: 12, price_per_unit: '' },
    { tier_level: 4, min_quantity: 24, price_per_unit: '' },
    { tier_level: 5, min_quantity: 60, price_per_unit: '' }
  ]);
  const [originalPrice, setOriginalPrice] = useState('');
  
  const [customerPrices, setCustomerPrices] = useState([]); // {company_id, price_per_unit}
  const [newCustomerPrice, setNewCustomerPrice] = useState({ company_id: '', price_per_unit: '' });

  const [contractPrices, setContractPrices] = useState([]); // {contract_number, company_id, price_per_unit, valid_until}
  const [newContractPrice, setNewContractPrice] = useState({ contract_number: '', company_id: '', price_per_unit: '', valid_until: '' });

  useEffect(() => {
    fetchProducts();
    fetchCompanies();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiService.getProducts();
      if (res.success) setProducts(res.data);
    } catch (err) {
      showToast('Lỗi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await apiService.getCompanies();
      if (res.success) setCompanies(res.data);
    } catch (err) {}
  };

  const resetForm = () => {
    setFormData({
      sku: '', product_name: '', category: 'Wine / Red', country_of_origin: '', 
      region: '', grape_variety: '', vintage_year: '', alcohol_content: '', 
      volume_ml: 750, moq: 1, description: '', image_url: ''
    });
    setIsEditMode(false);
    setEditProductId(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        const res = await apiService.updateProduct(editProductId, formData);
        if (res.success) {
          showToast('Cập nhật sản phẩm thành công!');
          setShowAddModal(false);
          fetchProducts();
        }
      } else {
        const res = await apiService.createProduct({ ...formData, tier_prices: [] });
        if (res.success) {
          showToast('Thêm sản phẩm thành công!');
          setShowAddModal(false);
          fetchProducts();
        }
      }
    } catch (err) {
      showToast('Lỗi khi lưu sản phẩm');
    }
  };

  const handleEditClick = (product) => {
    setFormData({
      sku: product.sku || '', 
      product_name: product.product_name || '', 
      category: product.category || 'Wine / Red', 
      country_of_origin: product.country_of_origin || '', 
      region: product.region || '', 
      grape_variety: product.grape_variety || '', 
      vintage_year: product.vintage_year || '', 
      alcohol_content: product.alcohol_content || '', 
      volume_ml: product.volume_ml || 750, 
      moq: product.moq || 1, 
      description: product.description || '', 
      image_url: product.image_url || ''
    });
    setEditProductId(product.product_id);
    setIsEditMode(true);
    setShowAddModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    try {
      const res = await apiService.deleteProduct(id);
      if (res.success) {
        showToast('Xóa sản phẩm thành công!');
        fetchProducts();
      }
    } catch (err) {
      showToast('Lỗi khi xóa sản phẩm');
    }
  };

  const handleOpenPriceModal = (product) => {
    setActiveProduct(product);
    setPriceType('ORIGINAL');
    
    // Reset tier prices mapping
    const baseTiers = [
      { tier_level: 1, min_quantity: 1, price_per_unit: '' },
      { tier_level: 2, min_quantity: 6, price_per_unit: '' },
      { tier_level: 3, min_quantity: 12, price_per_unit: '' },
      { tier_level: 4, min_quantity: 24, price_per_unit: '' },
      { tier_level: 5, min_quantity: 60, price_per_unit: '' }
    ];
    if (product.tier_prices && Array.isArray(product.tier_prices)) {
      product.tier_prices.forEach(pt => {
        const idx = pt.tier_level - 1;
        if (baseTiers[idx]) {
          baseTiers[idx].min_quantity = pt.min_quantity;
          baseTiers[idx].price_per_unit = pt.price_per_unit;
        }
      });
    }
    setTierPrices(baseTiers);
    setOriginalPrice(baseTiers[0].price_per_unit);

    setCustomerPrices([]);
    setContractPrices([]);
    setShowPriceModal(true);
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    let payloadPrices = [];
    let pType = priceType;

    if (priceType === 'ORIGINAL') {
      pType = 'TIER';
      payloadPrices = [{ tier_level: 1, min_quantity: 1, price_per_unit: originalPrice }];
    } else if (priceType === 'TIER') {
      payloadPrices = tierPrices.filter(t => t.price_per_unit);
    } else if (priceType === 'CUSTOMER') {
      payloadPrices = customerPrices;
    } else if (priceType === 'CONTRACT') {
      payloadPrices = contractPrices;
    }

    try {
      const res = await apiService.updateProductPrices(activeProduct.ProductID, {
        priceType: pType,
        prices: payloadPrices
      });
      if (res.success) {
        showToast('Cập nhật cấu hình giá thành công!');
        setShowPriceModal(false);
        fetchProducts();
      }
    } catch (err) {
      showToast('Lỗi khi cập nhật cấu hình giá');
    }
  };

  const formatVND = (val) => val ? Number(val).toLocaleString('vi-VN') + ' đ' : 'N/A';

  return (
    <div className="card-box" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: '#FFF' }}>
            <i className="fa-solid fa-tags gold-text"></i> Quản Lý Danh Mục Sản Phẩm & Giá
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cấu hình Giá theo: Khách hàng, Hợp đồng, Số lượng, Giá gốc.</p>
        </div>
        <button className="btn-redapron-gold" onClick={() => { resetForm(); setShowAddModal(true); }}>
          + Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* MODAL THÊM / SỬA SẢN PHẨM */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <h3 style={{ marginTop: 0, color: 'var(--accent-gold)', marginBottom: 0 }}>
                {isEditMode ? 'Cập Nhật Thông Tin Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                <div className="form-group"><label>Mã SKU *</label><input className="form-control" required value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} /></div>
                <div className="form-group"><label>Tên Sản Phẩm *</label><input className="form-control" required value={formData.product_name} onChange={e=>setFormData({...formData, product_name: e.target.value})} /></div>
                <div className="form-group"><label>Phân Loại *</label>
                  <select className="form-control" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>
                    <option value="Wine / Red">Wine / Red</option>
                    <option value="Wine / White">Wine / White</option>
                    <option value="Champagne">Champagne</option>
                    <option value="Spirits / Whisky">Spirits / Whisky</option>
                  </select>
                </div>
                <div className="form-group"><label>Quốc Gia</label><input className="form-control" value={formData.country_of_origin} onChange={e=>setFormData({...formData, country_of_origin: e.target.value})} /></div>
                <div className="form-group"><label>Giống Nho (Grape)</label><input className="form-control" value={formData.grape_variety} onChange={e=>setFormData({...formData, grape_variety: e.target.value})} /></div>
                <div className="form-group"><label>Hình Ảnh (URL)</label><input className="form-control" value={formData.image_url} onChange={e=>setFormData({...formData, image_url: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', gap: '10px' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn-redapron-gold">Lưu Thông Tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH GIÁ */}
      {showPriceModal && activeProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ marginTop: 0, color: 'var(--accent-gold)', marginBottom: '5px' }}>
                  Cấu Hình Giá: {activeProduct.product_name} ({activeProduct.sku})
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Hãy chọn hình thức thiết lập giá theo chuẩn quy trình B2B</p>
              </div>
              <button onClick={() => setShowPriceModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Hình thức Thiết Lập Giá *</label>
              <select className="form-control" value={priceType} onChange={e => setPriceType(e.target.value)}>
                <option value="ORIGINAL">1. Giá sản phẩm gốc (Niêm yết)</option>
                <option value="CUSTOMER">2. Giá theo khách hàng riêng</option>
                <option value="CONTRACT">3. Giá theo hợp đồng</option>
                <option value="TIER">4. Giá theo số lượng (Tier Pricing)</option>
              </select>
            </div>

            <form onSubmit={handlePriceSubmit}>
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '20px', minHeight: '200px' }}>
                
                {priceType === 'ORIGINAL' && (
                  <div>
                    <h4 style={{ color: 'var(--text-main)', marginTop: 0 }}>Cấu Hình Giá Gốc</h4>
                    <div className="form-group">
                      <label>Giá bán niêm yết (VNĐ) *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={originalPrice ? Number(originalPrice).toLocaleString('vi-VN') : ''} 
                        onChange={e => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          setOriginalPrice(rawValue);
                        }} 
                        required 
                      />
                    </div>
                  </div>
                )}

                {priceType === 'TIER' && (
                  <div>
                    <h4 style={{ color: 'var(--text-main)', marginTop: 0 }}>Cấu Hình Giá Theo Số Lượng</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                      {tierPrices.map((t, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginBottom: '5px' }}>Tier {t.tier_level}</div>
                          <label style={{ fontSize: '0.7rem' }}>Min Qty</label>
                          <input type="number" className="form-control" style={{ marginBottom: '5px', padding: '5px' }} value={t.min_quantity} onChange={e=>{
                            const newTiers = [...tierPrices]; newTiers[idx].min_quantity = e.target.value; setTierPrices(newTiers);
                          }} required />
                          <label style={{ fontSize: '0.7rem' }}>Giá / Đơn vị</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '5px' }} 
                            value={t.price_per_unit ? Number(t.price_per_unit).toLocaleString('vi-VN') : ''} 
                            onChange={e=>{
                              const rawValue = e.target.value.replace(/\D/g, '');
                              const newTiers = [...tierPrices]; newTiers[idx].price_per_unit = rawValue; setTierPrices(newTiers);
                            }} 
                            required 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {priceType === 'CUSTOMER' && (
                  <div>
                    <h4 style={{ color: '#FFF', marginTop: 0 }}>Cấu Hình Giá Khách Hàng (Customer Pricing)</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Khách Hàng (Doanh nghiệp B2B)</label>
                        <select className="form-control" value={newCustomerPrice.company_id} onChange={e=>setNewCustomerPrice({...newCustomerPrice, company_id: e.target.value})}>
                          <option value="">-- Chọn Doanh Nghiệp --</option>
                          {companies.filter(c => c.CompanyType === 'BUYER').map(c => (
                            <option key={c.CompanyID} value={c.CompanyID}>{c.CompanyName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Giá thỏa thuận (VNĐ)</label>
                        <input type="text" className="form-control" value={newCustomerPrice.price_per_unit ? Number(newCustomerPrice.price_per_unit).toLocaleString('vi-VN') : ''} onChange={e=>{
                          const rawValue = e.target.value.replace(/\D/g, '');
                          setNewCustomerPrice({...newCustomerPrice, price_per_unit: rawValue});
                        }} />
                      </div>
                      <button type="button" className="btn-redapron-gold" onClick={() => {
                        if(newCustomerPrice.company_id && newCustomerPrice.price_per_unit) {
                          setCustomerPrices([...customerPrices, newCustomerPrice]);
                          setNewCustomerPrice({ company_id: '', price_per_unit: '' });
                        }
                      }}>Thêm</button>
                    </div>
                    
                    {customerPrices.length > 0 && (
                      <table className="data-table">
                        <thead><tr><th>ID Công ty</th><th>Tên Công Ty</th><th>Giá Thỏa Thuận</th><th>Xóa</th></tr></thead>
                        <tbody>
                          {customerPrices.map((cp, idx) => (
                            <tr key={idx}>
                              <td><code style={{ color: 'var(--text-muted)' }}>COMP-{cp.company_id}</code></td>
                              <td>{companies.find(c=>c.CompanyID == cp.company_id)?.CompanyName || cp.company_id}</td>
                              <td style={{ color: '#10B981' }}>{formatVND(cp.price_per_unit)}</td>
                              <td><button type="button" onClick={() => setCustomerPrices(customerPrices.filter((_, i) => i !== idx))} style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Xóa</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {priceType === 'CONTRACT' && (
                  <div>
                    <h4 style={{ color: 'var(--accent-gold)', marginTop: 0 }}>Cấu Hình Giá Theo Hợp Đồng (Contract Pricing)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                      <div className="form-group" style={{ margin: 0 }}><label>Khách Hàng</label>
                        <select className="form-control" value={newContractPrice.company_id} onChange={e=>setNewContractPrice({...newContractPrice, company_id: e.target.value})}>
                          <option value="">-- Chọn Doanh Nghiệp --</option>
                          {companies.filter(c => c.CompanyType === 'BUYER').map(c => (
                            <option key={c.CompanyID} value={c.CompanyID}>{c.CompanyName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}><label>Mã Hợp Đồng</label><input type="text" className="form-control" value={newContractPrice.contract_number} onChange={e=>setNewContractPrice({...newContractPrice, contract_number: e.target.value})} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Giá trong Hợp đồng (VNĐ)</label><input type="text" className="form-control" value={newContractPrice.price_per_unit ? Number(newContractPrice.price_per_unit).toLocaleString('vi-VN') : ''} onChange={e=>{const rawValue = e.target.value.replace(/\D/g, ''); setNewContractPrice({...newContractPrice, price_per_unit: rawValue});}} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Hiệu lực đến (Valid Until)</label><input type="date" className="form-control" value={newContractPrice.valid_until} onChange={e=>setNewContractPrice({...newContractPrice, valid_until: e.target.value})} /></div>
                      <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                        <button type="button" className="btn-redapron-gold" onClick={() => {
                          if(newContractPrice.company_id && newContractPrice.price_per_unit && newContractPrice.contract_number && newContractPrice.valid_until) {
                            setContractPrices([...contractPrices, newContractPrice]);
                            setNewContractPrice({ contract_number: '', company_id: '', price_per_unit: '', valid_until: '' });
                          }
                        }}>Thêm Hợp Đồng</button>
                      </div>
                    </div>
                    {contractPrices.length > 0 && (
                      <table className="data-table">
                        <thead><tr><th>Hợp Đồng</th><th>Khách Hàng</th><th>Giá HĐ</th><th>Hạn</th><th>Xóa</th></tr></thead>
                        <tbody>
                          {contractPrices.map((cp, idx) => (
                            <tr key={idx}>
                              <td>{cp.contract_number}</td>
                              <td>{companies.find(c=>c.CompanyID == cp.company_id)?.CompanyName}</td>
                              <td style={{ color: '#10B981' }}>{formatVND(cp.price_per_unit)}</td>
                              <td>{cp.valid_until}</td>
                              <td><button type="button" onClick={() => setContractPrices(contractPrices.filter((_, i) => i !== idx))} style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>X</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowPriceModal(false)}>Hủy Thay Đổi</button>
                <button type="submit" className="btn-redapron-gold">Lưu Bảng Giá</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Sản Phẩm</th>
            <th>Loại & Xuất Xứ</th>
            <th>MOQ</th>
            <th>Tier 1 (Lẻ)</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
           {loading ? <tr><td colSpan="6" style={{textAlign:'center'}}>Đang tải...</td></tr> : 
           products.map(p => {
             const t1 = p.tier_prices?.find(t => t.tier_level === 1);
             return (
              <tr key={p.product_id}>
                <td><code>{p.sku}</code></td>
                <td style={{ fontWeight: '600' }}>{p.product_name}</td>
                <td>
                  <span style={{ color: 'var(--accent-gold)', fontSize: '0.8rem' }}>{p.category}</span><br/>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.country_of_origin}</span>
                </td>
                <td>{p.moq}</td>
                <td style={{ color: '#10B981' }}>{t1 ? formatVND(t1.price_per_unit) : 'N/A'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => {
                      handleEditClick(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} style={{ background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--accent-gold)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                      Sửa SP
                    </button>
                    <button onClick={() => {
                      handleOpenPriceModal(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} style={{ background: 'transparent', border: '1px solid #10B981', color: '#10B981', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                      Cấu hình Giá
                    </button>
                    <button onClick={() => handleDeleteClick(p.product_id)} style={{ background: 'transparent', border: '1px solid #E54D60', color: '#E54D60', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
             )
           })}
        </tbody>
      </table>

    </div>
  );
}
