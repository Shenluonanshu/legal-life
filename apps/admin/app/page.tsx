/**
 * 管理后台 — 数据看板
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>📊 数据看板</h1>

      <div style={gridStyle}>
        <StatCard title="总用户数" value="—" icon="👥" />
        <StatCard title="活跃游戏存档" value="—" icon="💾" />
        <StatCard title="法条总数" value="~80" icon="📜" />
        <StatCard title="场景总数" value="~20" icon="🎭" />
      </div>

      <div style={{ ...cardStyle, marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>📈 近期活动</h2>
        <p style={{ color: '#6c6c8a' }}>
          连接 Supabase 后将展示实时数据。当前显示的是 Phase 1 MVP 的预估数据。
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#e94560' }}>{value}</div>
      <div style={{ fontSize: 14, color: '#8b8baa', marginTop: 4 }}>{title}</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#1a1a2e', borderRadius: 12, padding: 20,
  border: '1px solid #2a2a4a',
};

const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 16,
};
