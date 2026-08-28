type IconName =
  | 'arrow'
  | 'book'
  | 'check'
  | 'heart'
  | 'headphones'
  | 'pause'
  | 'play'
  | 'search'
  | 'shuffle'
  | 'stop'
  | 'volume'

type IconProps = {
  name: IconName
  size?: number
  filled?: boolean
}

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="m9 18 6-6-6-6" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  headphones: (
    <>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M18 19v-5h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2ZM6 19v-5H4a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h2Z" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7V5Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  shuffle: (
    <>
      <path d="m16 3 4 4-4 4" />
      <path d="M4 7h3c5 0 5 10 10 10h3" />
      <path d="m16 13 4 4-4 4" />
      <path d="M4 17h3c1.4 0 2.4-.8 3.2-2" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" />,
  volume: (
    <>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
}

export function Icon({ name, size = 20, filled = false }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}
