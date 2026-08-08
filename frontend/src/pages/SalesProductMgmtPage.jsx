import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function SalesProductMgmtPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters (Swimlane 1: Nhập tiêu chí lọc)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriceStatus, setFilterPriceStatus] = useState('ALL');

  // Bulk Selection (Swimlane 1: Tick chọn 1 hoặc nhiều sản phẩm)
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
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

  // Price Modal State (Swimlane 1: Lựa chọn hình thức thiết lập giá)
  const [priceType, setPriceType] = useState('ORIGINAL'); // ORIGINAL, TIER, CONTRACT
  const [costPrice, setCostPrice] = useState('');
  const [basePrice, setBasePrice] = useState('');

  const [tierPrices, setTierPrices] = useState([
    { tier_level: 1, min_quantity: 1, price_per_unit: '' },
    { tier_level: 2, min_quantity: 6, price_per_unit: '' },
    { tier_level: 3, min_quantity: 12, price_per_unit: '' },
    { tier_level: 4, min_quantity: 24, price_per_unit: '' },
    { tier_level: 5, min_quantity: 60, price_per_unit: '' }
  ]);
  
  const [contractPrices, setContractPrices] = useState([]); // {contract_number, company_id, price_per_unit, valid_until}
  const [newContractPrice, setNewContractPrice] = useState({ contract_number: '', company_id: '', price_per_unit: '', valid_until: '' });

  useEffect(() => {
    fetchProducts();
    fetchCompanies();
  }, [filterCategory, filterPriceStatus]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiService.getProducts({
        category: filterCategory,
        priceStatus: filterPriceStatus,
        search: searchTerm
      });
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await apiService.uploadFile(file);
      if (res.success) {
        setFormData(prev => ({ ...prev, image_url: res.file_url }));
        showToast('Tải ảnh lên thành công!');
      }
    } catch (err) {
      showToast('Lỗi khi tải ảnh lên');
    }
  };

  // Open modal for single or bulk selected products
  const handleOpenPriceModal = (product = null) => {
    if (product) {
      setActiveProduct(product);
      setSelectedIds([product.product_id]);
      setCostPrice(product.cost_price || '');
      setBasePrice(product.base_price || (product.tier_prices?.[0]?.price_per_unit || ''));
      
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
    } else {
      setActiveProduct(null); // Bulk mode
      setCostPrice('');
      setBasePrice('');
      setTierPrices([
        { tier_level: 1, min_quantity: 1, price_per_unit: '' },
        { tier_level: 2, min_quantity: 6, price_per_unit: '' },
        { tier_level: 3, min_quantity: 12, price_per_unit: '' },
        { tier_level: 4, min_quantity: 24, price_per_unit: '' },
        { tier_level: 5, min_quantity: 60, price_per_unit: '' }
      ]);
    }
    setPriceType('ORIGINAL');
    setContractPrices([]);
    setShowPriceModal(true);
  };

  // Toggle selection for all visible products
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.product_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một sản phẩm để cài đặt giá!');
      return;
    }

    let payloadPrices = [];
    if (priceType === 'TIER') {
      payloadPrices = tierPrices.filter(t => t.price_per_unit);
    } else if (priceType === 'CONTRACT') {
      payloadPrices = contractPrices;
    }

    try {
      const res = await apiService.updateBatchProductPrices({
        product_ids: selectedIds,
        priceType: priceType,
        costPrice: costPrice,
        basePrice: basePrice,
        prices: payloadPrices
      });

      if (res.success) {
        showToast(`Cập nhật giá thành công cho ${selectedIds.length} sản phẩm!`);
        setShowPriceModal(false);
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật cấu hình giá');
    }
  };

  const formatVND = (val) => val ? Number(val).toLocaleString('vi-VN') + ' ₫' : 'N/A';

  return (
    <div className="card-box" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-tags gold-text"></i> Quản Lý Danh Mục Sản Phẩm & Bảng Giá
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Quản lý Giá gốc, Giá sỉ Tier 1-5, và Giá Hợp đồng theo đúng Activity Diagram.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedIds.length > 0 && (
            <button className="btn-redapron-gold" style={{ background: '#3B82F6', color: '#FFF' }} onClick={() => handleOpenPriceModal(null)}>
              <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }}></i>
              Đăng Giá Hàng Loạt ({selectedIds.length} SP)
            </button>
          )}
          <button className="btn-redapron-gold" onClick={() => { resetForm(); setShowAddModal(true); }}>
            + Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* FILTER BAR (Swimlane 1: Nhập tiêu chí lọc) */}
      <div style={{ background: '#F8F9FA', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#374151', marginBottom: '4px', display: 'block' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '4px' }}></i> Lọc Tên / SKU / Thương Hiệu
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nhập SKU, tên sản phẩm hoặc nhà sản xuất..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#374151', marginBottom: '4px', display: 'block' }}>
              Danh Mục
            </label>
            <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="ALL">-- Tất Cả Danh Mục --</option>
              <option value="Wine / Red">Wine / Red (Vang Đỏ)</option>
              <option value="Wine / White">Wine / White (Vang Trắng)</option>
              <option value="Whisky">Whisky (Rượu Mạnh)</option>
              <option value="Cognac">Cognac (Rượu Bổ)</option>
              <option value="Champagne">Champagne (Sâm-panh)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#374151', marginBottom: '4px', display: 'block' }}>
              Trạng Thái Giá
            </label>
            <select className="form-control" value={filterPriceStatus} onChange={e => setFilterPriceStatus(e.target.value)}>
              <option value="ALL">-- Tất Cả Trạng Thái --</option>
              <option value="PRICED">Đã Đăng Giá</option>
              <option value="UNPRICED">Chưa Đăng Giá</option>
            </select>
          </div>

          <button type="submit" className="btn-redapron-gold" style={{ width: '100%', height: '42px', padding: 0 }}>
            Lọc Dữ Liệu
          </button>
        </form>
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
                    <option value="Whisky">Whisky</option>
                    <option value="Cognac">Cognac</option>
                    <option value="Champagne">Champagne</option>
                  </select>
                </div>
                <div className="form-group"><label>Xuất Xứ *</label><input className="form-control" required value={formData.country_of_origin} onChange={e=>setFormData({...formData, country_of_origin: e.target.value})} /></div>
                <div className="form-group"><label>Vùng Sản Xuất</label><input className="form-control" value={formData.region} onChange={e=>setFormData({...formData, region: e.target.value})} /></div>
                <div className="form-group"><label>Giống Nho</label><input className="form-control" value={formData.grape_variety} onChange={e=>setFormData({...formData, grape_variety: e.target.value})} /></div>
                <div className="form-group"><label>Nồng Độ Cồn (%)</label><input type="number" step="0.1" className="form-control" value={formData.alcohol_content} onChange={e=>setFormData({...formData, alcohol_content: e.target.value})} /></div>
                <div className="form-group"><label>Dung Tích (ml)</label><input type="number" className="form-control" value={formData.volume_ml} onChange={e=>setFormData({...formData, volume_ml: e.target.value})} /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Hình Ảnh Sản Phẩm</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="file" accept="image/*" className="form-control" onChange={handleImageUpload} style={{ flex: 1 }} />
                    {formData.image_url && (
                      <img src={formData.image_url.startsWith('http') ? formData.image_url : (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') + formData.image_url : `http://localhost:5000${formData.image_url}`)} alt="Preview" style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn-redapron-gold">Lưu Sản Phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH BẢNG GIÁ (Swimlane 1 & Swimlane 3) */}
      {showPriceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', border: '2px solid #D4AF37', borderRadius: '10px', padding: '30px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', color: '#1A1A1A' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #F3F4F6', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ marginTop: 0, color: '#721C24', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                  <i className="fa-solid fa-sliders" style={{ marginRight: '8px' }}></i>
                  Cấu Hình Bảng Giá {activeProduct ? `- ${activeProduct.product_name}` : `(${selectedIds.length} Sản Phẩm Đã Chọn)`}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Áp dụng cập nhật cho tập {selectedIds.length} sản phẩm theo quy trình Activity Diagram.
                </span>
              </div>
              <button onClick={() => setShowPriceModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>✕</button>
            </div>

            <form onSubmit={handlePriceSubmit} style={{ marginTop: '20px' }}>
              
              {/* SELECTION OF PRICING MODE (Lựa chọn hình thức thiết lập giá) */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Hình Thức Thiết Lập Giá *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
                  {[
                    { id: 'ORIGINAL', label: '1. Giá Gốc (Cost & Base)', icon: 'fa-coins' },
                    { id: 'TIER', label: '2. Số Lượng (Tier 1-5)', icon: 'fa-layer-group' },
                    { id: 'CONTRACT', label: '3. Hợp Đồng (Contract)', icon: 'fa-file-signature' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPriceType(mode.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: priceType === mode.id ? '2px solid #721C24' : '1px solid #D1D5DB',
                        background: priceType === mode.id ? '#721C24' : '#F9FAFB',
                        color: priceType === mode.id ? '#FFFFFF' : '#374151',
                        fontWeight: '600',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className={`fa-solid ${mode.icon}`}></i> {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BRANCH 1: GIÁ GỐC (Nhập Giá vốn & Giá cơ sở) */}
              {priceType === 'ORIGINAL' && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px 0', color: '#721C24', fontSize: '0.95rem' }}>
                    <i className="fa-solid fa-tags" style={{ marginRight: '6px' }}></i> Thiết Lập Giá Vốn & Giá Cơ Sở (UPSERT into ProductPrices)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ color: '#374151' }}>Giá Vốn (Cost Price - VNĐ)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ví dụ: 800,000"
                        value={costPrice ? Number(costPrice).toLocaleString('vi-VN') : ''} 
                        onChange={e => setCostPrice(e.target.value.replace(/\D/g, ''))} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ color: '#374151' }}>Giá Cơ Sở (Base Price - VNĐ) *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ví dụ: 1,000,000"
                        value={basePrice ? Number(basePrice).toLocaleString('vi-VN') : ''} 
                        onChange={e => setBasePrice(e.target.value.replace(/\D/g, ''))} 
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BRANCH 2: SỐ LƯỢNG (Tier 1-5 & MOQ) */}
              {priceType === 'TIER' && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px 0', color: '#721C24', fontSize: '0.95rem' }}>
                    <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }}></i> Cấu Hình Giá Sỉ Theo Mức Số Lượng (DELETE + INSERT ProductTierPrices)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    {tierPrices.map((t, idx) => (
                      <div key={idx} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#D4AF37', marginBottom: '5px' }}>Tier {t.tier_level}</div>
                        <label style={{ fontSize: '0.7rem', color: '#4B5563' }}>Số lượng tối thiểu</label>
                        <input type="number" className="form-control" style={{ marginBottom: '6px', padding: '6px' }} value={t.min_quantity} onChange={e => {
                          const newTiers = [...tierPrices]; newTiers[idx].min_quantity = e.target.value; setTierPrices(newTiers);
                        }} />
                        <label style={{ fontSize: '0.7rem', color: '#4B5563' }}>Giá / Đơn vị (VNĐ)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ padding: '6px' }} 
                          value={t.price_per_unit ? Number(t.price_per_unit).toLocaleString('vi-VN') : ''} 
                          onChange={e => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            const newTiers = [...tierPrices]; newTiers[idx].price_per_unit = rawValue; setTierPrices(newTiers);
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BRANCH 3: HỢP ĐỒNG (Contract Pricing) */}
              {priceType === 'CONTRACT' && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px 0', color: '#721C24', fontSize: '0.95rem' }}>
                    <i className="fa-solid fa-file-signature" style={{ marginRight: '6px' }}></i> Cấu Hình Giá Hợp Đồng (INSERT/UPDATE ContractPrices)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ color: '#374151' }}>Chọn Đối Tác B2B *</label>
                      <select className="form-control" value={newContractPrice.company_id} onChange={e=>setNewContractPrice({...newContractPrice, company_id: e.target.value})}>
                        <option value="">-- Chọn Doanh Nghiệp --</option>
                        {companies.filter(c => c.CompanyType === 'BUYER').map(c => (
                          <option key={c.CompanyID} value={c.CompanyID}>{c.CompanyName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ color: '#374151' }}>Số Hợp Đồng *</label>
                      <input type="text" className="form-control" placeholder="Ví dụ: CTR-LOTTE-2026" value={newContractPrice.contract_number} onChange={e=>setNewContractPrice({...newContractPrice, contract_number: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ color: '#374151' }}>Giá Hợp Đồng (VNĐ) *</label>
                      <input type="text" className="form-control" placeholder="Nhập giá hợp đồng..." value={newContractPrice.price_per_unit ? Number(newContractPrice.price_per_unit).toLocaleString('vi-VN') : ''} onChange={e=>{
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setNewContractPrice({...newContractPrice, price_per_unit: rawValue});
                      }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ color: '#374151' }}>Thời Hạn Đến *</label>
                      <input type="date" className="form-control" value={newContractPrice.valid_until} onChange={e=>setNewContractPrice({...newContractPrice, valid_until: e.target.value})} />
                    </div>
                    <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                      <button type="button" className="btn-redapron-gold" onClick={() => {
                        if (newContractPrice.company_id && newContractPrice.price_per_unit && newContractPrice.contract_number) {
                          setContractPrices([...contractPrices, newContractPrice]);
                          setNewContractPrice({ contract_number: '', company_id: '', price_per_unit: '', valid_until: '' });
                        }
                      }}>Thêm Vào Danh Sách Hợp Đồng</button>
                    </div>
                  </div>

                  {contractPrices.length > 0 && (
                    <table className="data-table">
                      <thead><tr><th>Số HĐ</th><th>Đối Tác</th><th>Giá Hợp Đồng</th><th>Hạn Đến</th><th>Xóa</th></tr></thead>
                      <tbody>
                        {contractPrices.map((cp, idx) => (
                          <tr key={idx}>
                            <td><code>{cp.contract_number}</code></td>
                            <td>{companies.find(c=>c.CompanyID == cp.company_id)?.CompanyName}</td>
                            <td style={{ color: '#059669', fontWeight: '700' }}>{formatVND(cp.price_per_unit)}</td>
                            <td>{cp.valid_until || '2027-12-31'}</td>
                            <td><button type="button" onClick={() => setContractPrices(contractPrices.filter((_, i) => i !== idx))} style={{ color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Xóa</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ACTION BUTTONS (Swimlane 1: Bấm "Cập nhật - Lưu cấu hình") */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #E5E7EB' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowPriceModal(false)}>Hủy Bỏ</button>
                <button type="submit" className="btn-redapron-gold" style={{ minWidth: '180px' }}>
                  <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> Cập Nhật - Lưu Cấu Hình
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input 
                type="checkbox" 
                onChange={handleSelectAll} 
                checked={products.length > 0 && selectedIds.length === products.length} 
              />
            </th>
            <th>SKU</th>
            <th>Sản Phẩm</th>
            <th>Phân Loại</th>
            <th>Giá Cơ Sở</th>
            <th>Giá Sỉ Tier 1</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
           {loading ? <tr><td colSpan="7" style={{textAlign:'center', padding: '30px'}}>Đang tải dữ liệu sản phẩm...</td></tr> : 
           products.map(p => {
             const t1 = p.tier_prices?.find(t => t.tier_level === 1);
             const isChecked = selectedIds.includes(p.product_id);

             return (
              <tr key={p.product_id} style={{ background: isChecked ? '#EFF6FF' : 'transparent' }}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => handleSelectOne(p.product_id)} 
                  />
                </td>
                <td><code>{p.sku}</code></td>
                <td style={{ fontWeight: '600' }}>{p.product_name}</td>
                <td>
                  <span style={{ color: '#D4AF37', fontSize: '0.8rem', fontWeight: '600' }}>{p.category}</span><br/>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.country_of_origin}</span>
                </td>
                <td style={{ color: '#2563EB', fontWeight: '600' }}>{p.base_price > 0 ? formatVND(p.base_price) : 'Chưa nhập'}</td>
                <td style={{ color: '#059669', fontWeight: '600' }}>{t1 ? formatVND(t1.price_per_unit) : 'N/A'}</td>
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
                    }} style={{ background: '#721C24', border: '1px solid #721C24', color: '#FFF', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                      Cài Đặt Giá
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
