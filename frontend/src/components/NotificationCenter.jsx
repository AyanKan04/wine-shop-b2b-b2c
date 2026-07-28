import React, { useState } from 'react';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'NOTIF-001', type: 'warning', title: 'Hóa đơn sắp đến hạn', message: 'INV-2026-0104 đến hạn ngày 20/08/2026 (còn 23 ngày)', read: false, timestamp: '20:00' },
    { id: 'NOTIF-002', type: 'info', title: 'RFQ mới từ CONTINENTAL', message: 'Yêu cầu báo giá 40 thùng Château Margaux 2018', read: false, timestamp: '19:30' },
    { id: 'NOTIF-003', type: 'success', title: 'Giao hàng thành công', message: 'ORD-2026-8821 đã giao thành công đến LOTTE SAIGON', read: true, timestamp: '16:00' },
    { id: 'NOTIF-004', type: 'warning', title: 'Tồn kho thấp', message: 'Château Margaux còn 230 thùng khả dụng', read: false, timestamp: '14:00' },
    { id: 'NOTIF-005', type: 'info', title: 'Giấy phép chờ duyệt', message: '2 hồ sơ giấy phép rượu B2B đang chờ phê duyệt', read: false, timestamp: '10:00' }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const typeIcons = {
    warning: { icon: 'fa-triangle-exclamation', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    info: { icon: 'fa-circle-info', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    success: { icon: 'fa-circle-check', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    error: { icon: 'fa-circle-xmark', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* BELL BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'rgba(212,175,55,0.15)' : 'transparent',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-main)',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          position: 'relative',
          fontSize: '1rem',
          transition: 'all 0.2s'
        }}
      >
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#EF4444',
            color: '#FFF',
            fontSize: '0.6rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-primary)',
            animation: 'pulse-notification 2s infinite'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN PANEL */}
      {isOpen && (
        <>
          {/* OVERLAY */}
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1999 }}
          />
          <div style={{
            position: 'absolute',
            top: '45px',
            right: 0,
            width: '360px',
            maxHeight: '450px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            boxShadow: '0 15px 50px rgba(0,0,0,0.8)',
            zIndex: 2000,
            overflow: 'hidden',
            animation: 'fadeSlideDown 0.2s ease-out'
          }}>
            {/* HEADER */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: '#120D0F'
            }}>
              <span style={{ fontFamily: 'var(--font-brand)', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--accent-gold)' }}>
                THÔNG BÁO
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3B82F6',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* NOTIFICATION LIST */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {notifications.map(notif => {
                const typeStyle = typeIcons[notif.type] || typeIcons.info;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: notif.read ? 'transparent' : 'rgba(212,175,55,0.03)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: typeStyle.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <i className={`fa-solid ${typeStyle.icon}`} style={{ color: typeStyle.color, fontSize: '0.8rem' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.8rem', color: notif.read ? 'var(--text-muted)' : '#FFF' }}>
                          {notif.title}
                        </strong>
                        {!notif.read && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }}></span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '3px 0 0 0', lineHeight: '1.4' }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'inline-block' }}>
                        {notif.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
