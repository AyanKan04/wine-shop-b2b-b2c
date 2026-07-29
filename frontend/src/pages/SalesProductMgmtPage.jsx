import React, { useState } from 'react';

export default function SalesProductMgmtPage({ products, showToast }) {
  const [productList, setProductList] = useState(products || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newProduct, setNewProduct] = useState({
    product_name: '', sku: '', category: 'Fine Wine', country_of_origin: 'France',
    region: '', grape_variety: '', vintage_year: 2024, alcohol_content: 13.0,
    volume_ml: 750, moq: 5, image_url: '', description: '',
    tier_prices: [
      { tier_level: 1, min_quantity: 5, price_per_unit: 50000000 },
      { tier_level: 2, min_quantity: 20, price_per_unit: 45000000 },
      { tier_level: 3, min_quantity: 50, price_per_unit: 40000000 },
      { tier_level: 4, min_quantity: 100, price_per_unit: 36000000 },
      { tier_level: 5, min_quantity: 200, price_per_unit: 32000000 }
    ]
  });

  const formatVND = (val) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ ₫';
    if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Tr ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  const filteredProducts = productList.filter(p =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.product_name || !newProduct.sku) {
      showToast('Vui lòng điền Tên sản phẩm và SKU!');
      return;
    }
    if (productList.find(p => p.sku === newProduct.sku)) {
      showToast(`SKU "${newProduct.sku}" đã tồn tại!`);
      return;
    }

    const created = {
      ...newProduct,
      product_id: Math.max(0, ...productList.map(p => p.product_id)) + 1,
      vintage_year: parseInt(newProduct.vintage_year),
      alcohol_content: parseFloat(newProduct.alcohol_content),
      volume_ml: parseInt(newProduct.volume_ml),
      moq: parseInt(newProduct.moq),
      image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
    };

    setProductList([...productList, created]);
    showToast(`Đã thêm sản phẩm "${created.product_name}" thành công!`);
    setShowAddModal(false);
    setNewProduct({
      product_name: '', sku: '', category: 'Fine Wine', country_of_origin: 'France',
      region: '', grape_variety: '', vintage_year: 2024, alcohol_content: 13.0,
      volume_ml: 750, moq: 5, image_url: '', description: '',
      tier_prices: [
        { tier_level: 1, min_quantity: 5, price_per_unit: 50000000 },
        { tier_level: 2, min_quantity: 20, price_per_unit: 45000000 },
        { tier_level: 3, min_quantity: 50, price_per_unit: 40000000 },
        { tier_level: 4, min_quantity: 100, price_per_unit: 36000000 },
        { tier_level: 5, min_quantity: 200, price_per_unit: 32000000 }
      ]
    });
  };

  const handleDeleteProduct = (productId) => {
    const prod = productList.find(p => p.product_id === productId);
    setProductList(prev => prev.filter(p => p.product_id !== productId));
    showToast(`Đã xóa sản phẩm "${prod?.product_name}"`);
  };

  const handleOpenEditPrice = (product) => {
    setEditingProduct(JSON.parse(JSON.stringify(product)));
    setShowEditPriceModal(true);
  };

  const handleSaveTierPrices = (e) => {
    e.preventDefault();
    setProductList(prev => prev.map(p =>
      p.product_id === editingProduct.product_id ? { ...p, tier_prices: editingProduct.tier_prices } : p
    ));
    showToast(`Đã cập nhật bậc giá sỉ cho "${editingProduct.product_name}"!`);
    setShowEditPriceModal(false);
    setEditingProduct(null);
  };

  const updateTierPrice = (tierLevel, field, value) => {
    setEditingProduct(prev => ({
      ...prev,
      tier_prices: prev.tier_prices.map(t =>
        t.tier_level === tierLevel ? { ...t, [field]: parseInt(value) || 0 } : t
      )
    }));
  };

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <i className="fa-solid fa-tags gold-text"></i> Quản Lý Sản Phẩm & Bậc Giá Sỉ
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Thêm dòng rượu mới, thiết lập MOQ & cấu hình 5 bậc giá sỉ (Tier 1 đến Tier 5) cho từng sản phẩm.
          </p>
        </div>
        <button className="btn-redapron-gold" onClick={() => setShowAddModal(true)}>
          <i className="fa-solid fa-plus"></i> THÊM SẢN PHẨM MỚI
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Tìm kiếm theo tên sản phẩm hoặc SKU..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: '450px' }}
        />
      </div>

      {/* PRODUCT TABLE */}
      <div className="card-box">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>TÊN SẢN PHẨM</th>
              <th>LOẠI RƯỢU</th>
              <th>XUẤT XỨ</th>
              <th>ABV</th>
              <th>MOQ</th>
              <th>GIÁ TIER 1</th>
              <th>GIÁ TIER 5</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(prod => (
              <tr key={prod.product_id}>
                <td><code style={{ color: 'var(--accent-gold)' }}>{prod.sku}</code></td>
                <td style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '250px' }}>{prod.product_name}</td>
                <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prod.category}</span></td>
                <td>{prod.country_of_origin}</td>
                <td>{prod.alcohol_content}%</td>
                <td><strong>{prod.moq}</strong></td>
                <td className="gold-text">{prod.tier_prices ? formatVND(prod.tier_prices[0]?.price_per_unit) : '—'}</td>
                <td style={{ color: '#10B981' }}>{prod.tier_prices ? formatVND(prod.tier_prices[prod.tier_prices.length - 1]?.price_per_unit) : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEditPrice(prod)}
                      style={{
                        background: 'rgba(212,175,55,0.2)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)',
                        padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-pen"></i> Tier
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.product_id)}
                      style={{
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#EF4444',
                        padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Không tìm thấy sản phẩm nào.
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW PRODUCT */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Thêm Dòng Rượu Mới</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Tên Sản Phẩm *</label>
                  <input type="text" className="form-control" placeholder="Château Lafite Rothschild 2015" value={newProduct.product_name} onChange={e => setNewProduct({ ...newProduct, product_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Mã SKU *</label>
                  <input type="text" className="form-control" placeholder="SKU-FR-LAFITE2015" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Loại Rượu</label>
                  <select className="form-control" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                    <option value="Fine Wine">Fine Wine</option>
                    <option value="Spirits / Whisky">Spirits / Whisky</option>
                    <option value="Champagne">Champagne</option>
                    <option value="Cognac">Cognac</option>
                    <option value="Vodka">Vodka</option>
                    <option value="Sake">Sake</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quốc Gia</label>
                  <input type="text" className="form-control" placeholder="France" value={newProduct.country_of_origin} onChange={e => setNewProduct({ ...newProduct, country_of_origin: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Vùng</label>
                  <input type="text" className="form-control" placeholder="Bordeaux" value={newProduct.region} onChange={e => setNewProduct({ ...newProduct, region: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Giống Nho</label>
                  <input type="text" className="form-control" placeholder="Cabernet Sauvignon" value={newProduct.grape_variety} onChange={e => setNewProduct({ ...newProduct, grape_variety: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Niên Vụ</label>
                  <input type="number" className="form-control" value={newProduct.vintage_year} onChange={e => setNewProduct({ ...newProduct, vintage_year: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>ABV (%)</label>
                  <input type="number" step="0.1" className="form-control" value={newProduct.alcohol_content} onChange={e => setNewProduct({ ...newProduct, alcohol_content: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>MOQ (Thùng)</label>
                  <input type="number" className="form-control" value={newProduct.moq} onChange={e => setNewProduct({ ...newProduct, moq: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>URL Hình Ảnh</label>
                <input type="text" className="form-control" placeholder="https://images.unsplash.com/..." value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mô Tả Sản Phẩm</label>
                <input type="text" className="form-control" placeholder="Dòng rượu vang đỏ huyền thoại..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
              </div>

              {/* TIER PRICING SECTION */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-gold)', borderRadius: '6px', padding: '16px', marginTop: '10px', marginBottom: '15px' }}>
                <h5 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-body)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '12px' }}>CẤU HÌNH BẬC GIÁ SỈ (TIER 1 → TIER 5)</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {newProduct.tier_prices.map((tp, idx) => (
                    <div key={tp.tier_level} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Tier {tp.tier_level}</div>
                      <input
                        type="number"
                        className="form-control"
                        style={{ fontSize: '0.8rem', padding: '6px', textAlign: 'center' }}
                        value={tp.min_quantity}
                        onChange={e => {
                          const updated = [...newProduct.tier_prices];
                          updated[idx].min_quantity = parseInt(e.target.value) || 0;
                          setNewProduct({ ...newProduct, tier_prices: updated });
                        }}
                      />
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '4px 0' }}>thùng ↑</div>
                      <input
                        type="number"
                        className="form-control"
                        style={{ fontSize: '0.8rem', padding: '6px', textAlign: 'center' }}
                        value={tp.price_per_unit}
                        onChange={e => {
                          const updated = [...newProduct.tier_prices];
                          updated[idx].price_per_unit = parseInt(e.target.value) || 0;
                          setNewProduct({ ...newProduct, tier_prices: updated });
                        }}
                      />
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', marginTop: '4px' }}>{formatVND(tp.price_per_unit)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px' }}>HỦY</button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>LƯU & ĐĂNG SẢN PHẨM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TIER PRICES */}
      {showEditPriceModal && editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Chỉnh Sửa Bậc Giá Sỉ</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{editingProduct.product_name}</p>
              </div>
              <button onClick={() => setShowEditPriceModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSaveTierPrices}>
              <table className="data-table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr><th>BẬC</th><th>SỐ LƯỢNG TỐI THIỂU</th><th>ĐƠN GIÁ / THÙNG (VNĐ)</th></tr>
                </thead>
                <tbody>
                  {editingProduct.tier_prices && editingProduct.tier_prices.map(tp => (
                    <tr key={tp.tier_level}>
                      <td><strong>Tier {tp.tier_level}</strong></td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '120px', padding: '6px 10px' }}
                          value={tp.min_quantity}
                          onChange={e => updateTierPrice(tp.tier_level, 'min_quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '180px', padding: '6px 10px' }}
                          value={tp.price_per_unit}
                          onChange={e => updateTierPrice(tp.tier_level, 'price_per_unit', e.target.value)}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', marginLeft: '8px' }}>{formatVND(tp.price_per_unit)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowEditPriceModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px' }}>HỦY</button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>LƯU BẬC GIÁ</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
