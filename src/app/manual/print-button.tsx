'use client'

export function PrintManualButton() {
  return (
    <div className="no-print" style={{ textAlign: 'right', marginBottom: '1rem' }}>
      <button
        onClick={() => window.print()}
        style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
      >
        Imprimir / Salvar PDF
      </button>
    </div>
  )
}
