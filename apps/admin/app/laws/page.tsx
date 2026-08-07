/**
 * 管理后台 — 法律数据管理
 */
export default function LawsPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>📜 法律数据管理</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={secondaryButtonStyle}>📥 导入数据</button>
          <button style={buttonStyle}>+ 新增法条</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select style={selectStyle}>
          <option>全部国家</option>
          <option>中国 (CN)</option>
          <option>美国 (US)</option>
        </select>
        <select style={selectStyle}>
          <option>全部分类</option>
          <option>劳动就业</option>
          <option>消费者权益</option>
          <option>交通法规</option>
        </select>
        <input style={inputStyle} placeholder="搜索法条关键词..." />
      </div>

      {/* 统计概览 */}
      <div style={{ ...statsGrid, marginBottom: 20 }}>
        <div style={statBox}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#e94560' }}>~80</div>
          <div style={{ fontSize: 13, color: '#8b8baa' }}>总法条数</div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#34d399' }}>~60</div>
          <div style={{ fontSize: 13, color: '#8b8baa' }}>已审核</div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fbbf24' }}>~20</div>
          <div style={{ fontSize: 13, color: '#8b8baa' }}>待审核</div>
        </div>
      </div>

      {/* 法条列表 */}
      <div style={cardStyle}>
        <p style={{ color: '#6c6c8a', textAlign: 'center', padding: 40 }}>
          连接 Supabase 后将在此展示法条列表，支持 CRUD、审核标记和批量导入。
          <br /><br />
          数据来源：<code>legal-data/</code> 目录中的 YAML/JSON 文件
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

const secondaryButtonStyle: React.CSSProperties = {
  background: '#2a2a4a', color: '#e0e0e0', border: '1px solid #3a3a5a',
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

const statsGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
};

const statBox: React.CSSProperties = {
  ...cardStyle, textAlign: 'center',
};
