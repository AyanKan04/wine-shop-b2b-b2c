import React, { useState } from 'react';
import apiService from '../services/api';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  React.useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiService.getNotifications();
        if (res.success) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Lỗi fetch thông báo:", err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // 1 phút check 1 lần
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const typeIcons = {
    warning: { icon: 'fa-triangle-exclamation', color: '#F59E0B', bg: 'rgba(245,158,11,0.2)' },
    info: { icon: 'fa-circle-info', color: '#3B82F6', bg: 'rgba(59,130,246,0.2)' },
    success: { icon: 'fa-circle-check', color: '#10B981', bg: 'rgba(16,185,129,0.2)' },
    error: { icon: 'fa-circle-xmark', color: '#EF4444', bg: 'rgba(239,68,68,0.2)' }
  };

  const formatTimestamp = (ts) => {
    if (!ts || ts === 'Invalid Date' || ts.includes('NaN')) return 'Vừa xong';
    return ts;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* BELL BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'rgba(212,175,55,0.12)' : 'transparent',
          border: '1px solid var(--border-gold)',
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
            border: '2px solid #FFFFFF',
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
            background: '#FFFFFF',
            border: '1px solid var(--border-gold)',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
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
              borderBottom: '1px solid var(--border-gold)',
              background: '#F7F6F3'
            }}>
              <span style={{ fontFamily: 'var(--font-brand)', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-main)', fontWeight: '700' }}>
                THÔNG BÁO
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563EB',
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
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Không có thông báo mới
                </div>
              ) : (
                notifications.map(notif => {
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
                        background: notif.read ? '#FFFFFF' : '#FAF7EE',
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
                        <i className={`fa-solid ${typeStyle.icon}`} style={{ color: typeStyle.color, fontSize: '0.85rem' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.85rem', color: notif.read ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: '600' }}>
                            {notif.title}
                          </strong>
                          {!notif.read && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }}></span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', display: 'inline-block' }}>
                          {formatTimestamp(notif.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
