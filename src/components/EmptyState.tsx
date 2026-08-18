type EmptyStateProps = {
  eyebrow: string
  title: string
  description: string
}

export function EmptyState({ eyebrow, title, description }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lead">{description}</p>
      <div className="status-card">
        <span className="status-dot" aria-hidden="true" />
        <span>Initial setup complete</span>
      </div>
    </section>
  )
}
