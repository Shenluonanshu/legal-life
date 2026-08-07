/**
 * 管理后台 — 根布局
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '律途人生 · 管理后台',
  description: '场景管理、法律数据维护、数据看板',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f0f1a', color: '#e0e0e0' }}>
        <nav style={{
          background: '#1a1a2e', padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', gap: 24,
          borderBottom: '1px solid #2a2a4a',
        }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 'bold', color: '#e94560', textDecoration: 'none' }}>
            ⚖️ 律途人生
          </a>
          <a href="/" style={navLinkStyle}>数据看板</a>
          <a href="/scenarios" style={navLinkStyle}>场景管理</a>
          <a href="/laws" style={navLinkStyle}>法律数据</a>
        </nav>
        <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: '#8b8baa', textDecoration: 'none', fontSize: 14, fontWeight: 500,
};
