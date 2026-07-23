import React, { useState, useEffect } from 'react';

export default function AgeVerificationModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('is_age_verified');
    if (!verified) {
      setShowModal(true);
    }
  }, []);

  const handleConfirmAge = () => {
    localStorage.setItem('is_age_verified', 'true');
    setShowModal(false);
  };

  const handleRejectAge = () => {
    alert('Rất tiếc! Bạn cần phải đủ 18 tuổi trở lên để truy cập danh mục sản phẩm đồ uống có cồn theo quy định của pháp luật Việt Nam.');
    window.location.href = 'https://www.google.com';
  };

  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 3, 4, 0.96)',
      backdropFilter: 'blur(12px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1C1417 0%, #0A0708 100%)',
        border: '1px solid var(--border-gold)',
        borderRadius: '12px',
        padding: '45px 35px',
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(212, 175, 55, 0.12)',
          border: '1px solid var(--border-gold)',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          color: 'var(--accent-gold)',
          fontSize: '1.8rem'
        }}>
          <i className="fa-solid fa-[#D4AF37] fa-shield-halved"></i>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: 'var(--accent-gold)',
          textTransform: 'uppercase',
          letterSpacing: '2.5px',
          fontFamily: 'var(--font-brand)',
          marginBottom: '10px'
        }}>
          Xác Nhận Quy Định Độ Tuổi Pháp Lý
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', marginBottom: '15px', color: '#FFF' }}>
          Bạn Đã Đủ 18 Tuổi?
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '30px' }}>
          Theo quy định Luật Phòng, chống tác hại của rượu, bia (NĐ 105/2017/NĐ-CP), bạn phải đủ 18 tuổi trở lên để truy cập và xem thông tin sản phẩm đồ uống có cồn.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleConfirmAge}
            className="btn-redapron-gold"
            style={{ padding: '14px', width: '100%', fontSize: '0.8rem' }}
          >
            TÔI ĐÃ ĐỦ 18 TUỔI (VÀO HỆ THỐNG B2B)
          </button>

          <button
            onClick={handleRejectAge}
            className="btn-redapron-burgundy"
            style={{ padding: '12px', width: '100%', fontSize: '0.75rem', background: 'transparent', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            Tôi Dưới 18 Tuổi (Rời Khỏi Trang)
          </button>
        </div>

        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '25px' }}>
          Thưởng thức có trách nhiệm. Không lái xe sau khi sử dụng đồ uống có cồn.
        </div>
      </div>
    </div>
  );
}
