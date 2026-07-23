import React from 'react';

export default function WarehouseLogisticsPage({ inventory, showToast }) {
  return (
    <div className="page-container">
      <h2 className="page-title burgundy-text">11. WAREHOUSE & LOGISTICS: QUẢN LÝ KHO & BIÊN BẢN GIAO NHẬN</h2>
      <p className="page-subtitle">Theo dõi số lượng tồn kho thực tế, duyệt xuất kho và upload Biên bản Giao nhận</p>

      <div className="card-box">
        <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>TỒN KHO THỰC TẾ TRONG KHO HÀNG</h4>
        <table className="data-table">
          <thead>
            <tr><th>MÃ SKU</th><th>TỒN KHO THỰC TẾ</th><th>ĐÃ GIỮ CHO ĐƠN (RESERVED)</th><th>SỐ LƯỢNG KHẢ DỤNG</th></tr>
          </thead>
          <tbody>
            {inventory.map(inv => (
              <tr key={inv.product_id}>
                <td>{inv.sku}</td>
                <td>{inv.stock_on_hand} thùng</td>
                <td>{inv.reserved} thùng</td>
                <td className="gold-text"><strong>{inv.stock_on_hand - inv.reserved} thùng</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
