import { useEffect, useRef } from 'react'

type DictationScoringGuideProps = {
  onClose: () => void
}

export function DictationScoringGuide({ onClose }: DictationScoringGuideProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    closeButtonRef.current?.focus()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div
      className="dictation-scoring-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="dictation-scoring-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dictation-scoring-title"
        aria-describedby="dictation-scoring-summary"
      >
        <header className="dictation-scoring-dialog-header">
          <div>
            <p className="eyebrow">SCORING GUIDE</p>
            <h2 id="dictation-scoring-title">採点ルール</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="dictation-scoring-dialog-close"
            aria-label="採点ルールを閉じる"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="dictation-scoring-dialog-body">
          <p id="dictation-scoring-summary" className="dictation-scoring-summary">
            大文字・小文字、句読点、単語間の改行は減点されません。
          </p>

          <div className="dictation-scoring-grid">
            <section>
              <h3>減点されないもの</h3>
              <ul>
                <li>大文字・小文字</li>
                <li>ピリオド、カンマ、疑問符、感嘆符など</li>
                <li>単語間の改行、タブ、連続した空白</li>
                <li>文頭・文末の空白</li>
              </ul>
            </section>

            <section>
              <h3>減点されるもの</h3>
              <ul>
                <li>単語の抜け、余分な単語、スペルミス</li>
                <li>
                  アポストロフィ（<span lang="en">don't</span> の <code>'</code>）の有無
                </li>
                <li>単語の途中に入れた改行</li>
              </ul>
              <p>
                <code>’</code> と <code>‘</code> は通常の <code>'</code> として扱います。
              </p>
            </section>

            <section>
              <h3>点数とクリア条件</h3>
              <ul>
                <li>整形後に完全一致すると100点</li>
                <li>文字の追加・削除・置換の量に応じて減点</li>
                <li>未入力または空白だけなら0点</li>
                <li>90点以上でクリア</li>
              </ul>
            </section>
          </div>

          <div className="dictation-scoring-examples">
            <strong>例</strong>
            <span>
              <code>Hello, Doctor.</code> → <code>hello doctor</code>：100点
            </span>
            <span>単語間で改行：減点なし</span>
            <span>
              <code>don't</code> → <code>dont</code>：80点
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
