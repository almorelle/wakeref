import Icon from './Icon'

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <Icon name={t.type === 'success' ? 'check' : t.type === 'error' ? 'x' : 'info-circle'} />
          <span className="toast-msg">{t.message}</span>
          {t.action && (
            <button className="toast-action" onClick={t.action.onClick}>{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  )
}
