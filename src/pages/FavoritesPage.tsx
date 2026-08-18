import { EmptyState } from '../components/EmptyState'

export function FavoritesPage() {
  return (
    <EmptyState
      eyebrow="FAVORITES"
      title="Your saved voices."
      description="お気に入りに登録したオペレーターとボイスを一覧表示する画面です。"
    />
  )
}
