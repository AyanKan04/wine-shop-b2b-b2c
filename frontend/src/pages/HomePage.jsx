import React, { useState, useEffect } from 'react';

export default function HomePage({ onNavigateCatalog, onSelectProduct, products }) {
  // Animated counter hook simulating real-world physics deceleration
  const useCounter = (target, duration = 2200) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Cubic ease-out deceleration formula
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeProgress * target));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
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
      desc: 'Hệ thống giá sỉ Tier 1 → Tier 5 tự động tính theo số lượng. Mua càng nhiều, chiết khấu càng lớn.',
      color: '#5C1D24'
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
      color: '#10B981'
    },
    {
      icon: 'fa-truck-fast',
      title: 'Vận Chuyển & Giao Nhận Chuyên Biệt',
      desc: 'Theo dõi trạng thái vận chuyển thời gian thực. Hệ thống kho bảo quản lạnh chuyên dụng TP.HCM & Hà Nội.',
      color: '#8B5CF6'
    },
    {
      icon: 'fa-chart-line',
      title: 'Dashboard Analytics Realtime',
      desc: 'Biểu đồ doanh thu, quản lý tồn kho & theo dõi đơn hàng tích hợp trên một hệ thống duy nhất.',
      color: '#F59E0B'
    }
  ];

  const testimonials = [
    {
      company: 'LOTTE HOTEL SAIGON',
      quote: '"Maison de l\'Alcool đã thay đổi hoàn toàn quy trình mua sắm rượu sỉ của chúng tôi. Bảng giá sỉ 5 bậc minh bạch, hạn mức tín dụngNet-30 linh hoạt."',
      role: 'Purchasing Manager',
      icon: 'fa-hotel'
    },
    {
      company: 'CONTINENTAL HOTEL',
      quote: '"Hệ thống RFQ trực tuyến thông minh giúp tiết kiệm 60% thời gian thương lượng giá sỉ so với phương pháp truyền thống."',
      role: 'F&B Director',
      icon: 'fa-wine-glass'
    },
    {
      company: 'RED CHILI GROUP',
      quote: '"Sản phẩm nhập khẩu chính ngạch, đầy đủ CO/CQ cùng quy trình thẩm định hồ sơ chuẩn hóa pháp lý là lý do chúng tôi chọn Maison de l\'Alcool."',
      role: 'Supply Chain Lead',
      icon: 'fa-utensils'
    }
  ];

  return (
    <div style={{ position: 'relative' }}>
      
      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="hero-section" style={{ minHeight: '92dvh', padding: '120px 5%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(229, 224, 215, 0.4) 0%, rgba(247, 246, 243, 0.95) 100%)', zIndex: 1 }}></div>

        <div className="hero-content" style={{ position: 'relative', zIndex: 2, maxWidth: '980px', textAlign: 'center' }}>
          <p className="eyebrow-caption" style={{ marginBottom: '24px' }}>
            <i className="fa-solid fa-gem" style={{ marginRight: '8px' }}></i>
            B2B Fine Wines & Premium Spirits Platform
          </p>
          
          <h1 className="display-luxury" style={{ marginBottom: '28px', textTransform: 'uppercase' }}>
            Nền tảng phân phối sỉ<br />
            <span className="gold-gradient-text" style={{ fontWeight: '600' }}>Rượu Vang & Rượu Mạnh Cao Cấp</span>
          </h1>

          <p style={{ maxWidth: '720px', margin: '0 auto 45px', fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Giải pháp số hóa kênh phân phối sỉ rượu nhập khẩu dành cho các Khách sạn 5 sao, Nhà hàng cao cấp,
            Chuỗi đại lý toàn quốc. Đàm phán RFQ trực tiếp, cấp hạn mức tín dụng và quản trị đơn hàng tập trung.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-island-gold" onClick={onNavigateCatalog}>
              <span>Khám phá Catalog</span>
              <div className="arrow-wrapper">
                <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
              </div>
            </button>
            <button className="btn-island-gold" onClick={onNavigateCatalog} style={{ background: 'transparent', border: '1px solid var(--accent-burgundy)', color: 'var(--accent-burgundy)', boxShadow: 'none' }}>
              <span>Gửi RFQ Đàm Phán</span>
              <div className="arrow-wrapper" style={{ background: 'rgba(92, 29, 36, 0.08)' }}>
                <i className="fa-solid fa-paper-plane" style={{ fontSize: '0.7rem', color: 'var(--accent-burgundy)' }}></i>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS COUNTER BAR (Double Bezel) ═══════════════════ */}
      <section style={{ padding: '0 5%', marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        <div className="bezel-outer-shell" style={{ maxWidth: '1200px', margin: '0 auto', padding: '8px', borderRadius: '2.5rem' }}>
          <div className="bezel-inner-core" style={{ borderRadius: 'calc(2.5rem - 8px)', padding: '40px 5%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', textAlign: 'center' }}>
              {[
                { value: `${partnerCount}+`, label: 'Đối Tác B2B Xác Thực', icon: 'fa-building', color: '#D4AF37' },
                { value: `${productCount}+`, label: 'Dòng Rượu Nhập Khẩu', icon: 'fa-wine-bottle', color: '#5C1D24' },
                { value: `${orderCount}+`, label: 'Đơn Hàng Sỉ Đã Xử Lý', icon: 'fa-receipt', color: '#10B981' },
                { value: '99.8%', label: 'Tỷ Lệ Giao Hàng Đúng Hẹn', icon: 'fa-truck-fast', color: '#3B82F6' }
              ].map((stat, i) => (
                <div key={i} className="transition-premium" style={{ cursor: 'default' }}>
                  <i className={`fa-solid ${stat.icon}`} style={{ fontSize: '1.4rem', color: stat.color, marginBottom: '12px', display: 'block' }}></i>
                  <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED PRODUCTS (Asymmetric Bento) ═══════════════════ */}
      <section style={{ padding: '120px 5%', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '65px' }}>
          <p className="eyebrow-caption" style={{ marginBottom: '12px' }}>
            Tuyển Chọn Đặc Biệt
          </p>
          <h2 className="display-luxury" style={{ fontSize: '2.6rem', textTransform: 'uppercase' }}>Bộ Sưu Tập Rượu Cao Cấp</h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '1rem', fontStyle: 'italic', marginTop: '8px' }}>
            Bordeaux Premier Cru · Highland Single Malt · Champagne Pháp · Cognac đẳng cấp
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          {products.slice(0, 4).map((p, idx) => {
            const isLarge = idx === 0; // Make first item a large grid element
            return (
              <div 
                key={p.product_id} 
                className={`bezel-outer-shell glow-gold ${isLarge ? 'bento-item-large' : ''}`}
                onClick={() => onSelectProduct(p.product_id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="bezel-inner-core" style={{ padding: isLarge ? '45px' : '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '440px' }}>
                  
                  {/* Badge */}
                  <div style={{
                    position: 'absolute', top: '24px', right: '24px', zIndex: 10,
                    background: 'rgba(242, 239, 233, 0.8)', backdropFilter: 'blur(8px)',
                    border: '1px solid var(--accent-gold)',
                    padding: '6px 14px', borderRadius: '9999px', fontSize: '0.65rem',
                    color: 'var(--accent-burgundy)', fontFamily: 'var(--font-body)', letterSpacing: '1px',
                    fontWeight: '700'
                  }}>
                    {p.category}
                  </div>

                  <div style={{ display: 'flex', flexDirection: isLarge ? 'row' : 'column', gap: '30px', alignItems: 'center', height: '100%' }}>
                    
                    {/* Product Image */}
                    <div style={{ width: isLarge ? '45%' : '100%', display: 'flex', justifyContent: 'center' }}>
                      <img 
                        src={p.image_url} 
                        alt={p.product_name} 
                        style={{
                          height: isLarge ? '280px' : '200px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))',
                          transition: 'transform 700ms cubic-bezier(0.32, 0.72, 0, 1)'
                        }}
                        className="product-card-image"
                      />
                    </div>

                    {/* Product Info */}
                    <div style={{ width: isLarge ? '55%' : '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: isLarge ? 'left' : 'center' }}>
                      <p className="eyebrow-caption" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>
                        {p.country_of_origin} {p.region ? `· ${p.region}` : ''}
                      </p>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: isLarge ? '1.6rem' : '1.25rem', color: 'var(--text-main)', margin: '0 0 12px 0', lineHeight: '1.25' }}>
                        {p.product_name}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                        {p.description ? `${p.description.slice(0, 120)}...` : ''}
                      </p>
                    </div>

                  </div>

                  {/* Pricing / MOQ row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-gold)', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đóng gói tối thiểu (MOQ)</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{p.moq} Thùng</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá sỉ sập sàn (Tier 5)</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-burgundy)' }}>
                        {p.tier_prices && p.tier_prices.length > 0
                          ? `${(p.tier_prices[p.tier_prices.length - 1].price_per_unit / 1000000).toFixed(0)} Tr ₫`
                          : 'Liên hệ'}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <button className="btn-island-gold" onClick={onNavigateCatalog} style={{ padding: '16px 40px' }}>
            <span>Xem Toàn Bộ Catalog ({products.length} Dòng Rượu)</span>
            <div className="arrow-wrapper">
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
            </div>
          </button>
        </div>
      </section>

      {/* ═══════════════════ B2B ADVANTAGES (Structural Bento) ═══════════════════ */}
      <section style={{ background: '#EAE6DF', padding: '120px 5%', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '65px' }}>
            <p className="eyebrow-caption" style={{ color: 'var(--accent-burgundy)', marginBottom: '12px' }}>
              Quy Trình Chuẩn Doanh Nghiệp
            </p>
            <h2 className="display-luxury" style={{ fontSize: '2.4rem', textTransform: 'uppercase' }}>Giải Pháp B2B Chuyên Biệt</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
            {b2bAdvantages.map((adv, i) => (
              <div 
                key={i} 
                className="bezel-outer-shell" 
                style={{ borderRadius: '1.8rem', padding: '4px' }}
              >
                <div className="bezel-inner-core" style={{ borderRadius: 'calc(1.8rem - 4px)', padding: '30px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px',
                    background: `${adv.color}08`, border: `1px solid ${adv.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: adv.color, fontSize: '1.3rem'
                  }}>
                    <i className={`fa-solid ${adv.icon}`}></i>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>{adv.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>{adv.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS (Luxury Cards) ═══════════════════ */}
      <section style={{ padding: '120px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '65px' }}>
          <p className="eyebrow-caption" style={{ marginBottom: '12px' }}>
            Đồng Hành Cùng Sự Phát Triển
          </p>
          <h2 className="display-luxury" style={{ fontSize: '2.4rem', textTransform: 'uppercase' }}>Đối Tác Nói Về Chúng Tôi</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '35px' }}>
          {testimonials.map((t, i) => (
            <div key={i} className="bezel-outer-shell" style={{ borderRadius: '2rem', padding: '5px' }}>
              <div className="bezel-inner-core" style={{ padding: '35px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-gold)', fontSize: '1.25rem', marginBottom: '20px'
                  }}>
                    <i className={`fa-solid ${t.icon}`}></i>
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: '1.75', fontStyle: 'italic', marginBottom: '25px', fontFamily: 'var(--font-heading)' }}>
                    {t.quote}
                  </p>
                </div>
                <div style={{ borderTop: '1px solid var(--border-gold)', paddingTop: '20px' }}>
                  <strong style={{ color: 'var(--accent-burgundy)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>{t.company}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ CTA BANNER (Dramatic Double Bezel Block) ═══════════════════ */}
      <section style={{ padding: '0 5% 120px' }}>
        <div className="bezel-outer-shell" style={{ maxWidth: '900px', margin: '0 auto', padding: '8px', borderRadius: '2.5rem' }}>
          <div className="bezel-inner-core" style={{ padding: '80px 40px', textAlign: 'center', background: 'radial-gradient(circle, #FFFFFF 0%, #F5F3EE 100%)' }}>
            <h2 className="display-luxury" style={{ fontSize: '2.5rem', marginBottom: '18px', textTransform: 'uppercase' }}>
              Bắt đầu giao dịch sỉ<br />
              <span className="gold-gradient-text" style={{ fontWeight: '600' }}>Hợp tác cùng Maison de l'Alcool</span>
            </h2>
            
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 40px', fontSize: '0.95rem', lineHeight: '1.75' }}>
              Đăng ký tài khoản doanh nghiệp trực tuyến, cung cấp giấy phép hoạt động kinh doanh rượu để thẩm định và nhận ngay bảng giá chiết khấu đặc quyền từ nhà nhập khẩu chính ngạch.
            </p>

            <button className="btn-island-gold" onClick={onNavigateCatalog} style={{ padding: '18px 45px' }}>
              <span>Đăng Ký & Nhận Hạn Mức Tín Dụng</span>
              <div className="arrow-wrapper">
                <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
              </div>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
