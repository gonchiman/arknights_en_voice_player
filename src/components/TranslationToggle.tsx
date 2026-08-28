import { useAppState } from '../state/useAppState'

export function TranslationToggle() {
  const {
    showJapaneseTranslations,
    toggleJapaneseTranslations,
  } = useAppState()

  return (
    <button
      type="button"
      className="quiet-button translation-toggle"
      onClick={toggleJapaneseTranslations}
      aria-label="すべてのボイスの日本語訳"
      aria-pressed={showJapaneseTranslations}
    >
      すべての日本語訳：{showJapaneseTranslations ? '表示' : '非表示'}
    </button>
  )
}
