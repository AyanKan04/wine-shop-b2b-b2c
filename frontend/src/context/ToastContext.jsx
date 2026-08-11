import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, title }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, title = 'Thành công') => addToast(msg, 'success', title),
    error: (msg, title = 'Có lỗi xảy ra') => addToast(msg, 'error', title),
    info: (msg, title = 'Thông báo') => addToast(msg, 'info', title),
    warning: (msg, title = 'Cảnh báo') => addToast(msg, 'warning', title)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Global Toast Overlay */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type} slide-in-toast`}>
            <div className="toast-icon">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'warning' && '⚠'}
              {t.type === 'info' && 'ℹ'}
            </div>
            <div className="toast-content">
              <span className="toast-title">{t.title}</span>
              <p className="toast-message">{t.message}</p>
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback stub if used outside provider
    return {
      success: (msg) => console.log('[Toast Success]', msg),
      error: (msg) => console.error('[Toast Error]', msg),
      info: (msg) => console.log('[Toast Info]', msg),
      warning: (msg) => console.warn('[Toast Warning]', msg)
    };
  }
  return context;
};

export default ToastContext;
