import './ConfirmModal.css'

export default function ConfirmModal({ title, message, confirmText, confirmColor, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="confirm-ok"
            style={{ background: confirmColor || '#c5221f' }}
            onClick={onConfirm}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}