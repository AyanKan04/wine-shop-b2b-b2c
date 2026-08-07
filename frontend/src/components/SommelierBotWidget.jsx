import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/api.js';

export default function SommelierBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender_name: 'AI Sommelier Assistant',
      sender_role: 'AI_ASSISTANT',
      message_text: 'Xin kính chào quý đối tác. Tôi là chuyên gia thử nếm kiêm Trợ lý ảo của Red Apron. Quý đối tác cần tư vấn về niên vụ, nồng độ ABV, MOQ hay chính sách chiết khấu sỉ của dòng rượu nào?',
      created_at: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const suggestions = [
    'Tư vấn Château Margaux 2018',
    'Xem chiết khấu Macallan 18',
    'MOQ Dom Pérignon 2012 là bao nhiêu?',
    'Tìm hiểu chính sách Net-30'
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    // Append user message
    const userMsg = {
      id: Date.now(),
      sender_name: 'Khách hàng',
      sender_role: 'BUYER',
      message_text: text.trim(),
      created_at: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Direct call to general RFQ chat or general AI Sommelier channel (using a system reserved ID e.g. 999)
      const res = await apiService.sendChatMessage(999, {
        sender_name: 'Khách hàng B2B',
        sender_role: 'BUYER',
        message_text: text.trim() + ' @ai' // Force AI Sommelier trigger
      });

      if (res.success && res.data) {
        // Find the newly appended AI message from the response
        const aiMsgs = res.data.filter(m => m.sender_role === 'AI_ASSISTANT');
        if (aiMsgs.length > 0) {
          const latestAi = aiMsgs[aiMsgs.length - 1];
          setMessages(prev => [...prev, {
            id: latestAi.message_id || Date.now() + 1,
            sender_name: latestAi.sender_name,
            sender_role: latestAi.sender_role,
            message_text: latestAi.message_text,
            created_at: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
          }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        sender_name: 'AI Sommelier Assistant',
        sender_role: 'AI_ASSISTANT',
        message_text: 'Rất tiếc, kết nối đến chuyên gia Sommelier bị gián đoạn. Quý đối tác vui lòng thử lại sau ít phút.',
        created_at: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: 'var(--font-body)' }}>
      {/* COLLAPSED BUBBLE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#111111',
            border: '1px solid #111111',
            color: '#FFFFFF',
            fontSize: '1.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08) translateY(-3px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
        >
          <i className="fa-solid fa-wine-glass"></i>
        </button>
      )}

      {/* EXPANDED PANEL */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: '520px',
          background: '#FFFFFF',
          border: '1px solid var(--border-gold)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* HEADER */}
          <div style={{
            background: 'var(--bg-primary)',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)'
              }}>
                <i className="fa-solid fa-wine-bottle"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'var(--font-body)', fontWeight: '600', letterSpacing: '0.5px' }}>RedApron Sommelier</h4>
                <div style={{ fontSize: '0.65rem', color: '#346538', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#346538', display: 'inline-block' }}></span>
                  Trợ lý thử nếm & đàm phán sỉ
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* MESSAGES BODY */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: 'var(--bg-primary)'
          }}>
            {messages.map(msg => {
              const isAi = msg.sender_role === 'AI_ASSISTANT';
              return (
                <div key={msg.id} style={{
                  alignSelf: isAi ? 'flex-start' : 'flex-end',
                  maxWidth: '85%'
                }}>
                  {/* Sender Name */}
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    textAlign: isAi ? 'left' : 'right',
                    marginBottom: '4px'
                  }}>
                    {msg.sender_name} · {msg.created_at}
                  </div>
                  {/* Msg Box */}
                  <div style={{
                    background: isAi ? '#FFFFFF' : '#111111',
                    border: isAi ? '1px solid var(--border-gold)' : 'none',
                    padding: '12px 16px',
                    borderRadius: isAi ? '12px 12px 12px 0' : '12px 12px 0 12px',
                    color: isAi ? 'var(--text-main)' : '#FFFFFF',
                    fontSize: '0.8rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.message_text}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Sommelier đang soạn thảo...</div>
                <div style={{
                  background: '#FFFFFF', border: '1px solid var(--border-gold)',
                  padding: '12px 16px', borderRadius: '12px 12px 12px 0', display: 'flex', gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', background: 'var(--text-main)', borderRadius: '50%', animation: 'pulse 1s infinite alternate' }}></span>
                  <span style={{ width: '6px', height: '6px', background: 'var(--text-main)', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.2s' }}></span>
                  <span style={{ width: '6px', height: '6px', background: 'var(--text-main)', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* QUICK SUGGESTIONS */}
          {messages.length === 1 && (
            <div style={{ padding: '15px 20px 15px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gợi ý câu hỏi B2B:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      padding: '8px 12px',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'var(--font-body)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: '#FFFFFF'
          }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                className="form-control"
                style={{
                  flex: 1, padding: '10px 14px', fontSize: '0.8rem', background: 'var(--bg-primary)',
                  border: '1px solid var(--border-gold)', color: 'var(--text-main)', borderRadius: '6px'
                }}
                placeholder="Hỏi Sommelier về sản phẩm, chiết khấu..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-redapron-gold"
                style={{ width: '40px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111111', color: '#FFFFFF' }}
                disabled={loading}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
