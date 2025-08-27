import React from 'react'

export interface SummaryCardItem {
  label: string
  primary: string | number
  secondary?: string
  accentColor?: string
}

export function SummaryCardGrid({
  items,
  columnsMin = 220,
  gapPx = 12,
  className,
}: {
  items: SummaryCardItem[]
  columnsMin?: number
  gapPx?: number
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${columnsMin}px, 1fr))`,
        gap: `${gapPx}px`,
        marginBottom: '16px',
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            padding: '12px 14px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>{it.label}</div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: it.accentColor ?? '#2c3e50',
              wordBreak: 'break-word',
            }}
          >
            {it.primary}
          </div>
          {it.secondary && (
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>{it.secondary}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default SummaryCardGrid
