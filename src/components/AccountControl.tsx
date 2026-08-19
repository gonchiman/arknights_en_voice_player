import { useAppState } from '../state/useAppState'
import { useAuth } from '../state/useAuth'

const syncLabels = {
  local: '端末保存',
  syncing: '同期中…',
  synced: '同期済み',
  error: '同期失敗',
} as const

export function AccountControl() {
  const {
    user,
    isLoading,
    isConfigured,
    error: authError,
    signInWithGoogle,
    signOut,
    clearError,
  } = useAuth()
  const { syncStatus, syncError, lastSyncedAt, retrySync } = useAppState()

  if (isLoading) {
    return <span className="account-loading">ログイン確認中…</span>
  }

  if (!isConfigured) {
    return (
      <div className="account-control" title="Supabaseの環境変数を設定するとログインできます。">
        <span className="sync-indicator local">端末保存</span>
        <button type="button" className="auth-button" disabled>
          ログイン未設定
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="account-control">
        {authError && (
          <button
            type="button"
            className="account-error"
            onClick={clearError}
            title="クリックして閉じる"
          >
            {authError}
          </button>
        )}
        <button
          type="button"
          className="auth-button"
          onClick={() => void signInWithGoogle()}
        >
          Googleでログイン
        </button>
      </div>
    )
  }

  const displayName =
    (typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name) ||
    user.email ||
    'ログイン中'
  const syncTitle =
    syncError ??
    (lastSyncedAt
      ? `最終同期: ${new Date(lastSyncedAt).toLocaleString('ja-JP')}`
      : syncLabels[syncStatus])

  return (
    <div className="account-control signed-in">
      <span className="account-user" title={user.email}>
        {displayName}
      </span>
      <button
        type="button"
        className={`sync-indicator ${syncStatus}`}
        onClick={syncStatus === 'error' ? retrySync : undefined}
        title={syncStatus === 'error' ? `${syncTitle}。クリックして再試行` : syncTitle}
      >
        {syncLabels[syncStatus]}
      </button>
      <button type="button" className="auth-button secondary" onClick={() => void signOut()}>
        ログアウト
      </button>
      {authError && (
        <button
          type="button"
          className="account-error"
          onClick={clearError}
          title="クリックして閉じる"
        >
          {authError}
        </button>
      )}
    </div>
  )
}
