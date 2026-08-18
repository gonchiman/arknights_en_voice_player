import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Library', caption: 'ボイス', end: true },
  { to: '/favorites', label: 'Favorites', caption: 'お気に入り' },
  { to: '/dictation', label: 'Dictation', caption: '学習' },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label="トップページへ移動">
          <span className="brand-mark">R.I.</span>
          <span>
            <strong>VOICE RECORDS</strong>
            <small>Arknights EN Listening Archive</small>
          </span>
        </NavLink>

        <nav className="primary-nav" aria-label="メインメニュー">
          {navigation.map(({ to, label, caption, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <span>{label}</span>
              <small>{caption}</small>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div>
          <span>UNOFFICIAL FAN PROJECT</span>
          <p>
            音声の権利は各権利者に帰属します。学習・非商用目的のプロトタイプです。
          </p>
        </div>
        <a
          href="https://github.com/PseudoMon/arknights-audio"
          target="_blank"
          rel="noreferrer"
        >
          Audio archive ↗
        </a>
      </footer>
    </div>
  )
}
