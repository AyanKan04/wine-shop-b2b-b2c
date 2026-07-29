import React, { useState, useEffect } from 'react';

export default function HomePage({ onNavigateCatalog, onSelectProduct, products }) {
  // Animated counter hook
  const useCounter = (target, duration = 2000) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, [target, duration]);
    return count;
  };

  const partnerCount = useCounter(120);
  const productCount = useCounter(500);
  const orderCount = useCounter(2800);

  const b2bAdvantages = [
    {
      icon: 'fa-handshake',
      title: 'Đàm Phán RFQ Trực Tiếp',
      desc: 'Gửi yêu cầu báo giá (RFQ) và nhận Quotation chính xác từ bộ phận kinh doanh sỉ trong 24 giờ.',
      color: '#D4AF37'
    },
    {
      icon: 'fa-scale-balanced',
      title: 'Bảng Giá 5 Bậc Chiết Khấu',
      desc: 'Hệ thống giá sỉ Tier 1 → Tier 5 tự động tính theo số lượng. Mua càng nhiều, giá càng tốt.',
      color: '#10B981'
    },
    {
      icon: 'fa-credit-card',
      title: 'Hạn Mức Tín Dụng Net-30',
      desc: 'Được cấp hạn mức nợ trả sau 30 ngày lên đến 1 Tỷ VNĐ cho đối tác doanh nghiệp uy tín.',
      color: '#3B82F6'
    },
    {
      icon: 'fa-shield-halved',
      title: 'Tuân Thủ NĐ 105/2017/NĐ-CP',
      desc: '100% Giấy Phép Rượu hợp lệ. Thẩm định pháp lý nghiêm ngặt trước khi kích hoạt tài khoản sỉ.',
      color: '#E54D60'
    },
    {
      icon: 'fa-truck-fast',
      title: 'Vận Chuyển & Giao Nhận Chuyên Biệt',
      desc: 'Theo dõi trạng thái vận chuyển thời gian thực. Kho hàng tại TP.HCM & Hà Nội.',
      color: '#8B5CF6'
    },
    {
      icon: 'fa-chart-line',
      title: 'Dashboard Analytics Realtime',
      desc: 'Biểu đồ doanh thu, quản lý kho & theo dõi pipeline CRM tích hợp trên một nền tảng duy nhất.',
      color: '#F59E0B'
    }
  ];

  const testimonials = [
    {
      company: 'LOTTE HOTEL SAIGON',
      quote: '"Red Apron đã thay đổi hoàn toàn quy trình mua sắm rượu sỉ của chúng tôi. Bảng giá minh bạch, hạn mức tín dụng linh hoạt."',
      role: 'Purchasing Manager',
      icon: 'fa-hotel'
    },
    {
      company: 'CONTINENTAL HOTEL',
      quote: '"Hệ thống RFQ trực tuyến tiết kiệm 60% thời gian đàm phán so với phương pháp truyền thống."',
      role: 'F&B Director',
      icon: 'fa-wine-glass'
    },
    {
      company: 'RED CHILI GROUP',
      quote: '"Chất lượng rượu nhập khẩu chính ngạch, đầy đủ CO/CQ. Đối tác tin cậy cho chuỗi nhà hàng cao cấp."',
      role: 'Supply Chain Lead',
      icon: 'fa-utensils'
    }
  ];

  return (
    <div>
      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Subtle animated gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(114,21,32,0.3) 0%, rgba(10,7,8,0.9) 40%, rgba(10,7,8,0.95) 100%)',
          zIndex: 1
        }}></div>

        <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{
            letterSpacing: '5px', textTransform: 'uppercase', color: 'var(--accent-gold)',
            fontSize: '0.8rem', marginBottom: '18px', fontFamily: 'var(--font-brand)'
          }}>
            <i className="fa-solid fa-gem" style={{ marginRight: '8px' }}></i>
            B2B Fine Wines & Premium Spirits Platform
          </p>
          <h1 className="hero-title" style={{ fontSize: '3.2rem', lineHeight: 1.15, marginBottom: '20px' }}>
            NỀN TẢNG PHÂN PHỐI SỈ<br />
            <span className="gold-gradient-text">RƯỢU VANG & RƯỢU MẠNH CAO CẤP</span>
          </h1>
          <p className="hero-subtitle" style={{ maxWidth: '680px', margin: '0 auto 30px', fontSize: '1rem', lineHeight: 1.7 }}>
            Giải pháp phân phối sỉ rượu B2B chuyên biệt dành cho Khách sạn 5 sao, Nhà hàng cao cấp,
            Đại lý & Siêu thị toàn quốc. Đàm phán giá sỉ, hạn mức tín dụng & quản lý đơn hàng trên một nền tảng duy nhất.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-redapron-gold" onClick={onNavigateCatalog} style={{ padding: '14px 30px', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-wine-glass"></i> KHÁM PHÁ CATALOG
            </button>
            <button className="btn-redapron-burgundy" onClick={onNavigateCatalog} style={{ padding: '14px 30px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>
              <i className="fa-solid fa-paper-plane"></i> GỬI RFQ NGAY
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS COUNTER BAR ═══════════════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #120D0F 0%, #0A0708 100%)',
        borderTop: '1px solid var(--border-gold)',
        borderBottom: '1px solid var(--border-gold)',
        padding: '30px 5%'
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', textAlign: 'center'
        }}>
          {[
            { value: `${partnerCount}+`, label: 'Đối Tác B2B', icon: 'fa-building', color: '#D4AF37' },
            { value: `${productCount}+`, label: 'Dòng Rượu Nhập Khẩu', icon: 'fa-wine-bottle', color: '#E54D60' },
            { value: `${orderCount}+`, label: 'Đơn Hàng Sỉ Đã Xử Lý', icon: 'fa-receipt', color: '#10B981' },
            { value: '99.8%', label: 'Tỷ Lệ Giao Hàng Đúng Hẹn', icon: 'fa-truck-fast', color: '#3B82F6' }
          ].map((stat, i) => (
            <div key={i}>
              <i className={`fa-solid ${stat.icon}`} style={{ fontSize: '1.5rem', color: stat.color, marginBottom: '8px', display: 'block' }}></i>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FFF', fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURED PRODUCTS ═══════════════════ */}
      <div className="page-container" style={{ maxWidth: '1300px', padding: '60px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'var(--font-brand)', marginBottom: '10px' }}>
            Tuyển Chọn Đặc Biệt
          </p>
          <h2 className="page-title" style={{ fontSize: '2rem' }}>BỘ SƯU TẬP RƯỢU CAO CẤP</h2>
          <p className="page-subtitle">Bordeaux Premier Cru · Highland Single Malt · Champagne Pháp · Cognac đẳng cấp</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
          {products.slice(0, 4).map(p => (
            <div key={p.product_id} className="card-box" style={{ padding: '22px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => onSelectProduct(p.product_id)}>
              {/* Category badge */}
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'rgba(212,175,55,0.15)', border: '1px solid var(--border-gold)',
                padding: '3px 10px', borderRadius: '12px', fontSize: '0.65rem',
                color: 'var(--accent-gold)', fontFamily: 'var(--font-brand)', letterSpacing: '0.5px'
              }}>
                {p.category}
              </div>

              <img src={p.image_url} alt={p.product_name} style={{
                width: '100%', height: '220px', objectFit: 'contain', marginBottom: '15px',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))'
              }} />
              <p style={{ color: 'var(--accent-gold)', fontSize: '0.7rem', letterSpacing: '1.5px', fontFamily: 'var(--font-brand)' }}>
                {p.country_of_origin} · {p.region}
              </p>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '8px 0', lineHeight: 1.3 }}>{p.product_name}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                {p.description?.slice(0, 80)}...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MOQ: {p.moq} Thùng | ABV: {p.alcohol_content}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Giá từ Tier 5</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                    {(p.tier_prices[p.tier_prices.length - 1].price_per_unit / 1000000).toFixed(0)} Tr ₫
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '35px' }}>
          <button className="btn-redapron-gold" onClick={onNavigateCatalog} style={{ padding: '12px 35px' }}>
            <i className="fa-solid fa-grid-2"></i> XEM TOÀN BỘ CATALOG ({products.length} Dòng Rượu)
          </button>
        </div>
      </div>

      {/* ═══════════════════ B2B ADVANTAGES ═══════════════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #0D0A0B 0%, #140E10 100%)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '60px 5%'
      }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '45px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'var(--font-brand)', marginBottom: '10px' }}>
              Tại Sao Chọn Red Apron B2B?
            </p>
            <h2 className="page-title" style={{ fontSize: '1.8rem' }}>GIẢI PHÁP TOÀN DIỆN CHO DOANH NGHIỆP</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {b2bAdvantages.map((adv, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '10px',
                  background: `${adv.color}15`, border: `1px solid ${adv.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: adv.color, fontSize: '1.2rem'
                }}>
                  <i className={`fa-solid ${adv.icon}`}></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: '#FFF', marginBottom: '6px' }}>{adv.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section style={{ padding: '60px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'var(--font-brand)', marginBottom: '10px' }}>
              Đối Tác Tin Tưởng
            </p>
            <h2 className="page-title" style={{ fontSize: '1.8rem' }}>PHẢN HỒI TỪ KHÁCH HÀNG DOANH NGHIỆP</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="card-box" style={{ padding: '28px' }}>
                <div style={{
                  width: '45px', height: '45px', borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-gold)', fontSize: '1.2rem', marginBottom: '14px'
                }}>
                  <i className={`fa-solid ${t.icon}`}></i>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '18px' }}>
                  {t.quote}
                </p>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <strong style={{ color: 'var(--accent-gold)', fontSize: '0.8rem' }}>{t.company}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA BANNER ═══════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #721520 0%, #0A0708 100%)',
        borderTop: '1px solid var(--border-gold)',
        borderBottom: '1px solid var(--border-gold)',
        padding: '60px 5%',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '15px' }}>
            Bắt Đầu <span className="gold-gradient-text">Giao Dịch Sỉ</span> Ngay Hôm Nay
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px', lineHeight: 1.7 }}>
            Đăng ký tài khoản doanh nghiệp, tải lên giấy phép rượu & bắt đầu nhận bảng giá sỉ chiết khấu đặc biệt Tier 1 đến Tier 5.
          </p>
          <button className="btn-redapron-gold" onClick={onNavigateCatalog} style={{ padding: '16px 40px', fontSize: '0.9rem' }}>
            <i className="fa-solid fa-rocket"></i> ĐĂNG KÝ & NHẬN BÁO GIÁ
          </button>
        </div>
      </section>
    </div>
  );
}
