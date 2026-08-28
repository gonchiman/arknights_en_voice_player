import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  appSections,
  gameModes,
  getGameModeFromPath,
  getGamePath,
  getModeSwitchPath,
} from '../config/gameModes'
import { AccountControl } from './AccountControl'

export function AppLayout() {
  const location = useLocation()
  const currentGameId = getGameModeFromPath(location.pathname)
  const currentGame = gameModes.find((gameMode) => gameMode.id === currentGameId) ?? gameModes[0]

  useEffect(() => {
    document.title = `${currentGame.name} EN Voice Player`
  }, [currentGame.name])

  return (
    <div className="app-shell" data-game-mode={currentGame.id}>
      <header className="app-header">
        <div className="brand-group">
          <Link
            className="brand"
            to={getGamePath(currentGame.id, 'operators')}
            aria-label={`${currentGame.name}モードのトップページへ移動`}
          >
            <strong>{currentGame.name} EN Voice Player</strong>
          </Link>

          <nav className="game-mode-switch" aria-label="ゲームモード切替">
            {gameModes.map((gameMode) => {
              const active = gameMode.id === currentGame.id

              return (
                <Link
                  key={gameMode.id}
                  className={active ? 'game-mode-button active' : 'game-mode-button'}
                  to={getModeSwitchPath(gameMode.id, location.pathname)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{gameMode.switchLabel}</span>
                  {gameMode.beta && <small>BETA</small>}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="app-header-actions">
          <nav className="primary-nav" aria-label="メインメニュー">
            {appSections.map(({ id, label }) => (
              <NavLink
                key={id}
                to={getGamePath(currentGame.id, id)}
                end
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
        {currentGame.id === 'arknights' ? (
          <a
            href="https://github.com/PseudoMon/arknights-audio"
            target="_blank"
            rel="noreferrer"
          >
            音声データ
          </a>
        ) : (
          <span className="footer-status">Endfield音声データ準備中</span>
        )}
      </footer>
    </div>
  )
}
