import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  appSections,
  gameModes,
  getGameModeFromPath,
  getGamePath,
  getModeSwitchPath,
} from '../config/gameModes'
import { getGameCatalog } from '../data/catalogs'
import { canUseBrowserTts } from '../lib/voicePlayback'
import { GameCatalogContext } from '../state/gameCatalogContext'
import { AccountControl } from './AccountControl'

export function AppLayout() {
  const location = useLocation()
  const currentGameId = getGameModeFromPath(location.pathname)
  const currentGame = gameModes.find((gameMode) => gameMode.id === currentGameId) ?? gameModes[0]
  const catalog = getGameCatalog(currentGameId)
  const ttsUnavailable = catalog.id === 'endfield' && !canUseBrowserTts()

  useEffect(() => {
    document.title = `${currentGame.name} EN Voice Player`
  }, [currentGame.name])

  return (
    <GameCatalogContext.Provider value={catalog}>
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
          {catalog.notice && (
            <aside className="mode-notice" aria-label="Endfieldモードの音声について">
              <strong>BROWSER TTS MODE</strong>
              <span>
                {ttsUnavailable
                  ? 'このブラウザは音声読み上げに対応していないため、台詞の閲覧のみ利用できます。'
                  : catalog.notice}
              </span>
              <a href={catalog.source.url} target="_blank" rel="noreferrer">
                データ出典
              </a>
            </aside>
          )}
          <Outlet key={catalog.id} />
        </main>

        <footer className="app-footer">
          <p>
            {catalog.id === 'endfield'
              ? '非公式ファンプロジェクト。ゲームテキスト・キャラクターデータの権利はHYPERGRYPH / GRYPHLINEに帰属します。'
              : '非公式ファンプロジェクト。ゲーム素材の権利は各権利者に帰属します。'}
          </p>
          <a href={catalog.source.url} target="_blank" rel="noreferrer">
            {catalog.source.label}
          </a>
        </footer>
      </div>
    </GameCatalogContext.Provider>
  )
}
