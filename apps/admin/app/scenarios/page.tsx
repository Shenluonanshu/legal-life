/**
 * 管理后台 — 场景管理
 */
export default function ScenariosPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>🎭 场景管理</h1>
        <button style={buttonStyle}>+ 创建场景</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select style={selectStyle}>
          <option>全部国家</option>
          <option>中国 (CN)</option>
          <option>美国 (US)</option>
        </select>
        <select style={selectStyle}>
          <option>全部人生阶段</option>
          <option>青年期</option>
          <option>壮年期</option>
        </select>
        <input style={inputStyle} placeholder="搜索场景..." />
      </div>

      {/* 场景列表 */}
      <div style={cardStyle}>
        <p style={{ color: '#6c6c8a', textAlign: 'center', padding: 40 }}>
          连接 Supabase 后将在此展示场景列表，支持 CRUD 操作和 AI 图片管理。
        </p>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#1a1a2e', borderRadius: 12, padding: 20,
  border: '1px solid #2a2a4a',
};

const buttonStyle: React.CSSProperties = {
  background: '#e94560', color: '#fff', border: 'none',
  borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600,
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4a',
  borderRadius: 8, padding: '8px 12px', fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4a',
  borderRadius: 8, padding: '8px 12px', fontSize: 14, flex: 1,
};
