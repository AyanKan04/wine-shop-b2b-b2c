import React, { useState } from 'react';

// Sub-Dashboard Components
import CRMKanbanPage from './CRMKanbanPage.jsx';
import AdminDashboardPage from './AdminDashboardPage.jsx';
import SalesProductMgmtPage from './SalesProductMgmtPage.jsx';
import RFQManagementPage from './RFQManagementPage.jsx';
import RFQProcessingPage from './RFQProcessingPage.jsx';
import FinanceMgmtPage from './FinanceMgmtPage.jsx';
import WarehouseLogisticsPage from './WarehouseLogisticsPage.jsx';

// Overview Tab Data
const revenueMonthly = [
  { month: 'T1', revenue: 8.2, orders: 12 },
  { month: 'T2', revenue: 9.5, orders: 15 },
  { month: 'T3', revenue: 7.8, orders: 11 },
  { month: 'T4', revenue: 11.2, orders: 18 },
  { month: 'T5', revenue: 13.5, orders: 22 },
  { month: 'T6', revenue: 15.8, orders: 25 },
  { month: 'T7', revenue: 18.65, orders: 30 }
];

const topProducts = [
  { name: 'Macallan 18', percentage: 36, color: '#D4AF37' },
  { name: 'Château Margaux', percentage: 24, color: '#E54D60' },
  { name: 'Dom Pérignon', percentage: 16, color: '#3B82F6' },
  { name: 'Hennessy X.O', percentage: 14, color: '#10B981' },
  { name: 'Khác', percentage: 10, color: '#6B7280' }
];

const activityLogs = [
  { id: 1, timestamp: '20:25', module: 'CRM', action: 'Chuyển DEAL-101 sang Đang Đàm Phán', actor: 'Sales Admin', icon: 'fa-square-kanban', color: '#F59E0B' },
  { id: 2, timestamp: '19:40', module: 'Finance', action: 'Thanh toán hóa đơn INV-2026-0091 thành công', actor: 'Kế Toán', icon: 'fa-receipt', color: '#10B981' },
  { id: 3, timestamp: '18:15', module: 'Warehouse', action: 'Xuất kho 20 thùng Macallan 18 cho ORD-2026-8821', actor: 'Warehouse Staff', icon: 'fa-boxes-stacked', color: '#3B82F6' },
  { id: 4, timestamp: '17:00', module: 'Admin', action: 'Phê duyệt giấy phép rượu LIC-001 cho LOTTE SAIGON', actor: 'Platform Admin', icon: 'fa-shield-halved', color: '#E54D60' },
  { id: 5, timestamp: '15:30', module: 'CRM', action: 'Tạo cơ hội B2B mới DEAL-106 từ CONTINENTAL', actor: 'Sales Rep', icon: 'fa-handshake', color: '#8B5CF6' },
  { id: 6, timestamp: '14:00', module: 'Sales', action: 'Cập nhật Tier Price Macallan 18 - Giảm 5% Tier 3', actor: 'Sales Manager', icon: 'fa-tags', color: '#D4AF37' },
  { id: 7, timestamp: 'Hôm qua', module: 'System', action: 'Backup dữ liệu hệ thống tự động hoàn tất', actor: 'System Worker', icon: 'fa-server', color: '#6B7280' },
  { id: 8, timestamp: 'Hôm qua', module: 'Warehouse', action: 'Nhập kho 100 thùng Hennessy X.O từ nhà cung cấp', actor: 'Warehouse Staff', icon: 'fa-truck-ramp-box', color: '#3B82F6' }
];

function OverviewDashboard() {
  const maxRevenue = Math.max(...revenueMonthly.map(d => d.revenue));
  
  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      <div style={{ marginBottom: '25px' }}>
        <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <i className="fa-solid fa-chart-line gold-text"></i> Tổng Quan Hệ Thống & Analytics
        </h2>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Biểu đồ doanh thu, top sản phẩm và nhật ký hoạt động real-time của toàn nền tảng B2B.
        </p>
      </div>

      {/* QUICK STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '25px' }}>
        {[
          { label: 'Doanh Thu T7', value: '18.65 Tỷ ₫', color: '#D4AF37', icon: 'fa-coins', change: '+18%' },
          { label: 'Đơn Hàng T7', value: '30', color: '#10B981', icon: 'fa-receipt', change: '+20%' },
          { label: 'Đối Tác B2B', value: '4', color: '#3B82F6', icon: 'fa-building', change: '+2 mới' },
          { label: 'Cơ Hội CRM', value: '5', color: '#8B5CF6', icon: 'fa-handshake', change: '40% chốt' },
          { label: 'Tồn Kho', value: '1,650', color: '#F59E0B', icon: 'fa-warehouse', change: 'thùng' },
          { label: 'Giao Hàng', value: '2', color: '#EC4899', icon: 'fa-truck', change: 'đang chờ' }
        ].map((stat, idx) => (
          <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
              <i className={`fa-solid ${stat.icon}`} style={{ color: stat.color, fontSize: '0.9rem' }}></i>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: stat.color, marginTop: '6px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '3px' }}>{stat.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px' }}>
        {/* REVENUE CHART */}
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-chart-bar gold-text"></i> Biểu Đồ Doanh Thu Theo Tháng (2026)
          </h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '220px', padding: '0 10px' }}>
            {revenueMonthly.map((d, idx) => {
              const heightPercent = (d.revenue / maxRevenue) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent-gold)' }}>{d.revenue}T</span>
                  <div style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    background: idx === revenueMonthly.length - 1
                      ? 'linear-gradient(180deg, #D4AF37 0%, #AA820A 100%)'
                      : 'linear-gradient(180deg, rgba(212,175,55,0.4) 0%, rgba(114,21,32,0.6) 100%)',
                    borderRadius: '4px 4px 0 0',
                    border: idx === revenueMonthly.length - 1 ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    transition: 'height 0.5s ease',
                    minHeight: '10px',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap'
                    }}>
                      {d.month}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ height: '30px' }}></div>
        </div>

        {/* TOP PRODUCTS PIE */}
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-ranking-star gold-text"></i> Top Sản Phẩm
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topProducts.map((prod, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#FFF' }}>{prod.name}</span>
                  <strong style={{ fontSize: '0.8rem', color: prod.color }}>{prod.percentage}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{
                    width: `${prod.percentage}%`,
                    height: '100%',
                    borderRadius: '4px',
                    background: prod.color,
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVITY TIMELINE */}
      <div className="card-box">
        <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-clock-rotate-left gold-text"></i> Nhật Ký Hoạt Động Hệ Thống
        </h4>
        <div style={{ position: 'relative', paddingLeft: '30px' }}>
          {/* TIMELINE LINE */}
          <div style={{ position: 'absolute', left: '11px', top: '0', bottom: '0', width: '2px', background: 'var(--border-subtle)' }}></div>
          
          {activityLogs.map((log, idx) => (
            <div key={log.id} style={{
              display: 'flex',
              gap: '14px',
              marginBottom: idx === activityLogs.length - 1 ? 0 : '18px',
              position: 'relative'
            }}>
              {/* DOT */}
              <div style={{
                position: 'absolute',
                left: '-24px',
                top: '4px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: log.color,
                border: '3px solid var(--bg-card)',
                zIndex: 1,
                boxShadow: `0 0 8px ${log.color}40`
              }}></div>

              {/* CONTENT */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={`fa-solid ${log.icon}`} style={{ color: log.color, fontSize: '0.8rem' }}></i>
                    <span style={{
                      fontSize: '0.7rem',
                      color: log.color,
                      background: `${log.color}15`,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontFamily: 'var(--font-brand)',
                      letterSpacing: '0.5px'
                    }}>
                      {log.module}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#FFF', margin: '4px 0 2px 0' }}>{log.action}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bởi: {log.actor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [activeAdminModule, setActiveAdminModule] = useState('overview');

  const adminModules = [
    { id: 'overview', title: '📊 Tổng Quan', icon: 'fa-chart-line', desc: 'Dashboard Analytics & Activity Feed' },
    { id: 'kanban', title: '1. CRM Kanban', icon: 'fa-square-kanban', desc: 'Đàm phán RFQ & Pipeline Báo Giá' },
    { id: 'executive', title: '2. Admin Duyệt Phép', icon: 'fa-shield-halved', desc: 'Thẩm định Giấy Phép Rượu & Doanh Nghiệp' },
    { id: 'sales-products', title: '3. Sales Đăng Giá', icon: 'fa-tags', desc: 'Bảng Giá Sỉ 5 Tiers & Sản Phẩm' },
    { id: 'buyer-rfq-mgmt', title: '4. Quản Lý RFQ', icon: 'fa-file-invoice-dollar', desc: 'Quản Lý RFQ, Đàm Phán & Chấp Nhận Báo Giá' },
    { id: 'sales-rfq', title: '5. Xử Lý Báo Giá', icon: 'fa-comments-dollar', desc: 'Tiếp Nhận RFQ & Phát Hành Quotation' },
    { id: 'finance', title: '6. Kế Toán Nợ', icon: 'fa-scale-balanced', desc: 'Hạn Mức Net-30 & Giám Sát Nợ' },
    { id: 'warehouse', title: '7. Kho & Vận Chuyển', icon: 'fa-boxes-stacked', desc: 'Tồn Kho, Đặt Trước & Vận Chuyển' }
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '90vh', paddingBottom: '50px' }}>
      
      {/* UNIFIED ADMIN HEADER BAR */}
      <div style={{
        background: 'var(--bg-surface)',
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
            background: 'rgba(159, 47, 45, 0.1)',
            border: '1px solid rgba(159, 47, 45, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9F2F2D',
            fontSize: '1.4rem'
          }}>
            <i className="fa-solid fa-crown"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-body)', fontWeight: '600' }}>
              Red Apron Executive Suite
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Trung Tâm Quản Trị Thống Nhất (Master Admin Console)
            </h1>
          </div>
        </div>

        {/* SYSTEM STATUS CAPSULE */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-gold)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse-dot 2s infinite' }}></span>
            <span>API Server: <strong>Port 5000 (Active)</strong></span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-gold)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-user-shield" style={{ color: '#9F2F2D' }}></i>
            <span>Role: <strong>Master Administrator</strong></span>
          </div>
        </div>
      </div>

      {/* UNIFIED MODULE NAVIGATION TABS BAR */}
      <div style={{
        background: 'var(--bg-surface)',
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
                background: isActive ? '#111111' : '#FFFFFF',
                border: isActive ? '1px solid #111111' : '1px solid var(--border-gold)',
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                padding: '10px 18px',
                borderRadius: '6px',
                fontFamily: 'var(--font-body)',
                fontWeight: '600',
                fontSize: '0.78rem',
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'none'
              }}
            >
              <i className={`fa-solid ${mod.icon}`} style={{ color: isActive ? '#FFFFFF' : 'var(--text-muted)' }}></i>
              <span>{mod.title}</span>
            </button>
          );
        })}
      </div>

      {/* ADMIN WORKSPACE CONTENT VIEW AREA */}
      <div style={{ padding: '20px 0' }}>
        {activeAdminModule === 'overview' && (
          <OverviewDashboard />
        )}
        {activeAdminModule === 'kanban' && (
          <CRMKanbanPage showToast={showToast} />
        )}
        {activeAdminModule === 'executive' && (
          <AdminDashboardPage showToast={showToast} />
        )}
        {activeAdminModule === 'sales-products' && (
          <SalesProductMgmtPage products={products} showToast={showToast} />
        )}
        {activeAdminModule === 'buyer-rfq-mgmt' && (
          <RFQManagementPage rfqs={rfqs} quotations={quotations} showToast={showToast} />
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
