// src/components/layout/AppLayout.jsx
import Sidebar from './Sidebar';
import { Icon } from '../common/index.jsx';

export default function AppLayout({ children, activePage, onNavigate, title }) {
  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="main-content">
        <header className="topbar">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.3px' }}>
            {title}
          </h1>
          <div className="flex items-center gap-12">
            <button style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: 4 }}>
              <Icon name="bell" size={18}/>
            </button>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
