import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Operators', end: true },
  { to: '/favorites', label: 'Favorites' },
  { to: '/dictation', label: 'Dictation' },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label="トップページへ移動">
          Arknights EN Voice Player
        </NavLink>

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
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
