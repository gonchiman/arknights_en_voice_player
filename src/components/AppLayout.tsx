import { NavLink, Outlet } from 'react-router-dom'
import { AccountControl } from './AccountControl'

const navigation = [
  { to: '/', label: 'ボイス一覧', end: true },
  { to: '/favorites', label: 'お気に入り' },
  { to: '/dictation', label: 'ディクテーション' },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label="トップページへ移動">
          <strong>Arknights EN Voice Player</strong>
        </NavLink>

        <div className="app-header-actions">
          <nav className="primary-nav" aria-label="メインメニュー">
            {navigation.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <AccountControl />
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>非公式ファンプロジェクト。音声の権利は各権利者に帰属します。</p>
        <a
          href="https://github.com/PseudoMon/arknights-audio"
          target="_blank"
          rel="noreferrer"
        >
          音声データ
        </a>
      </footer>
    </div>
  )
}
