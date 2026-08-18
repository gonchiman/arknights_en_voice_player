import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { OperatorCard } from '../components/OperatorCard'
import { PageHeader } from '../components/PageHeader'
import { VoicePlayer } from '../components/VoicePlayer'
import { getOperator, operators, voiceLines } from '../data/operators'
import { useAppState } from '../state/useAppState'

export function FavoritesPage() {
  const navigate = useNavigate()
  const { favoriteOperatorIds, favoriteVoiceIds } = useAppState()
  const favoriteOperators = operators.filter((operator) =>
    favoriteOperatorIds.includes(operator.id),
  )
  const favoriteVoices = voiceLines.filter((line) => favoriteVoiceIds.includes(line.id))

  return (
    <>
      <PageHeader
        eyebrow="PERSONAL ARCHIVE / FAVORITES"
        title="Your saved voices."
        description="お気に入りのオペレーターとボイスはこの端末に保存されます。ログインなしで、すぐに続きを聞けます。"
        action={
          <div className="library-stats">
            <span>
              <strong>{favoriteOperators.length}</strong> operators
            </span>
            <span>
              <strong>{favoriteVoices.length}</strong> voices
            </span>
          </div>
        }
      />

      {favoriteOperators.length === 0 && favoriteVoices.length === 0 ? (
        <section className="favorites-empty">
          <span className="empty-icon">
            <Icon name="heart" size={30} />
          </span>
          <p className="eyebrow">NOTHING SAVED YET</p>
          <h2>何度も聞きたい声を集めましょう。</h2>
          <p>ライブラリのハートを押すと、ここからすぐに再生できます。</p>
          <Link className="primary-button" to="/">
            Voice libraryへ
            <Icon name="arrow" size={17} />
          </Link>
        </section>
      ) : (
        <div className="favorites-content">
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">SAVED OPERATORS</p>
                <h2>{favoriteOperators.length} operators</h2>
              </div>
            </div>
            {favoriteOperators.length > 0 ? (
              <div className="operator-list favorite-operator-grid">
                {favoriteOperators.map((operator) => (
                  <OperatorCard
                    key={operator.id}
                    operator={operator}
                    onSelect={() => navigate(`/?operator=${operator.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="muted-block">保存したオペレーターはまだありません。</p>
            )}
          </section>

          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">SAVED VOICE RECORDS</p>
                <h2>{favoriteVoices.length} voices</h2>
              </div>
            </div>
            {favoriteVoices.length > 0 ? (
              <div className="favorite-voice-list">
                {favoriteVoices.map((line) => {
                  const operator = getOperator(line.operatorId)
                  return (
                    <div key={line.id} className="favorite-voice-item">
                      <div className="favorite-voice-owner">
                        <span>{operator?.initials}</span>
                        <div>
                          <strong>{operator?.name}</strong>
                          <small>{operator?.japaneseName}</small>
                        </div>
                      </div>
                      <VoicePlayer voice={line} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="muted-block">保存したボイスはまだありません。</p>
            )}
          </section>
        </div>
      )}
    </>
  )
}
