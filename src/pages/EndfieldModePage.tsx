import type { AppSection } from '../config/gameModes'

const sectionCopy: Record<AppSection, { eyebrow: string; title: string; description: string }> = {
  operators: {
    eyebrow: 'VOICE LIBRARY',
    title: 'Endfieldのボイスデータを準備中です。',
    description:
      'モード切替は利用できます。オペレーター、英語音声、日本語訳のデータが整い次第、ここに一覧を追加します。',
  },
  favorites: {
    eyebrow: 'SAVED VOICES',
    title: 'Endfieldのお気に入りは準備中です。',
    description:
      'ボイスデータの追加後、Arknightsとは分けてEndfieldのオペレーターと音声を保存できるようにします。',
  },
  dictation: {
    eyebrow: 'DICTATION',
    title: 'Endfieldのディクテーションは準備中です。',
    description:
      '英語音声と台詞の対応が整い次第、現在の採点体験をEndfieldでも利用できるようにします。',
  },
}

type EndfieldModePageProps = {
  section: AppSection
}

export function EndfieldModePage({ section }: EndfieldModePageProps) {
  const copy = sectionCopy[section]

  return (
    <section className="endfield-mode-panel">
      <div className="endfield-mode-marker" aria-hidden="true">
        EF
      </div>
      <div className="endfield-mode-copy">
        <div className="endfield-mode-label">
          <span>ENDFIELD MODE</span>
          <small>BETA</small>
        </div>
        <p className="endfield-mode-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>
    </section>
  )
}
