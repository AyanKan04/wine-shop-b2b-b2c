import React, { useState } from 'react';

// Sub-Dashboard Components
import CRMKanbanPage from './CRMKanbanPage.jsx';
import AdminDashboardPage from './AdminDashboardPage.jsx';
import SalesProductMgmtPage from './SalesProductMgmtPage.jsx';
import RFQProcessingPage from './RFQProcessingPage.jsx';
import FinanceMgmtPage from './FinanceMgmtPage.jsx';
import WarehouseLogisticsPage from './WarehouseLogisticsPage.jsx';

export default function MasterAdminWorkspacePage({
  showToast,
  products,
  rfqs,
  quotations,
  orders,
  credit,
  invoices,
  licenses,
  inventory
}) {
  const [activeAdminModule, setActiveAdminModule] = useState('kanban'); // 'kanban' | 'executive' | 'sales-products' | 'sales-rfq' | 'finance' | 'warehouse'

  const adminModules = [
    { id: 'kanban', title: '1. CRM Kanban', icon: 'fa-square-kanban', desc: 'Đàm phán RFQ & Pipeline Báo Giá' },
    { id: 'executive', title: '2. Admin Duyệt Phép', icon: 'fa-shield-halved', desc: 'Thẩm định Giấy Phép Rượu & Doanh Nghiệp' },
    { id: 'sales-products', title: '3. Sales Đăng Giá', icon: 'fa-tags', desc: 'Bảng Giá Sỉ 5 Tiers & Sản Phẩm' },
    { id: 'sales-rfq', title: '4. Xử Lý Báo Giá', icon: 'fa-comments-dollar', desc: 'Tiếp Nhận RFQ & Phát Hành Quotation' },
    { id: 'finance', title: '5. Kế Toán Nợ', icon: 'fa-scale-balanced', desc: 'Hạn Mức Net-30 & Giám Sát Nợ' },
    { id: 'warehouse', title: '6. Kho & Vận Chuyển', icon: 'fa-boxes-stacked', desc: 'Tồn Kho, Đặt Trước & Vận Chuyển' }
  ];

  return (
    <div style={{ background: '#090607', minHeight: '90vh', paddingBottom: '50px' }}>
      
      {/* UNIFIED ADMIN HEADER BAR */}
      <div style={{
        background: 'linear-gradient(180deg, #140E10 0%, #0D0A0B 100%)',
        borderBottom: '1px solid var(--border-gold)',
        padding: '20px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: '8px',
            background: 'rgba(229, 77, 96, 0.15)',
            border: '1px solid rgba(229, 77, 96, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#E54D60',
            fontSize: '1.4rem'
          }}>
            <i className="fa-solid fa-crown"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-brand)' }}>
              Red Apron Executive Suite
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: 0, color: '#FFF' }}>
              Trung Tâm Quản Trị Thống Nhất (Master Admin Console)
            </h1>
          </div>
        </div>

        {/* SYSTEM STATUS CAPSULE */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#1C1417', border: '1px solid var(--border-gold)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span>API Server: <strong>Port 5000 (Active)</strong></span>
          </div>

          <div style={{ background: '#1C1417', border: '1px solid var(--border-gold)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-user-shield burgundy-text"></i>
            <span>Role: <strong>Master Administrator</strong></span>
          </div>
        </div>
      </div>

      {/* UNIFIED MODULE NAVIGATION TABS BAR */}
      <div style={{
        background: '#120D0F',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 5%',
        display: 'flex',
        gap: '10px',
        overflowX: 'auto'
      }}>
        {adminModules.map(mod => {
          const isActive = activeAdminModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveAdminModule(mod.id)}
              style={{
                background: isActive ? 'var(--accent-burgundy)' : '#1A1315',
                border: isActive ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                color: isActive ? '#FFF' : 'var(--text-muted)',
                padding: '10px 18px',
                borderRadius: '6px',
                fontFamily: 'var(--font-brand)',
                fontSize: '0.78rem',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? '0 4px 15px rgba(114, 21, 32, 0.4)' : 'none'
              }}
            >
              <i className={`fa-solid ${mod.icon}`} style={{ color: isActive ? 'var(--accent-gold)' : '#A89F91' }}></i>
              <span>{mod.title}</span>
            </button>
          );
        })}
      </div>

      {/* ADMIN WORKSPACE CONTENT VIEW AREA */}
      <div style={{ padding: '20px 0' }}>
        {activeAdminModule === 'kanban' && (
          <CRMKanbanPage showToast={showToast} />
        )}
        {activeAdminModule === 'executive' && (
          <AdminDashboardPage showToast={showToast} />
        )}
        {activeAdminModule === 'sales-products' && (
          <SalesProductMgmtPage products={products} showToast={showToast} />
        )}
        {activeAdminModule === 'sales-rfq' && (
          <RFQProcessingPage rfqs={rfqs} showToast={showToast} />
        )}
        {activeAdminModule === 'finance' && (
          <FinanceMgmtPage credit={credit} invoices={invoices} showToast={showToast} />
        )}
        {activeAdminModule === 'warehouse' && (
          <WarehouseLogisticsPage inventory={inventory} orders={orders} showToast={showToast} />
        )}
      </div>

    </div>
  );
}
