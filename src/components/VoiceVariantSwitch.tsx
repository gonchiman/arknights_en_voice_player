import type { VoiceLine, VoiceVariant } from '../types/app'

type VoiceVariantSwitchProps = {
  voices: VoiceLine[]
  value: VoiceVariant
  onChange: (value: VoiceVariant) => void
}

const options: { value: VoiceVariant; label: string }[] = [
  { value: 'female', label: '女性音声' },
  { value: 'male', label: '男性音声' },
]

export function VoiceVariantSwitch({
  voices,
  value,
  onChange,
}: VoiceVariantSwitchProps) {
  const availableOptions = options
    .map((option) => ({
      ...option,
      count: voices.filter((voice) => voice.voiceVariant === option.value).length,
    }))
    .filter((option) => option.count > 0)

  if (availableOptions.length < 2) return null

  return (
    <div className="voice-variant-switch" role="group" aria-label="管理人の音声タイプ">
      {availableOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'active' : undefined}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          <small>{option.count}</small>
        </button>
      ))}
    </div>
  )
}
