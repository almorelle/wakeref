import Icon from './Icon'

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <Icon name={t.type === 'success' ? 'check' : t.type === 'error' ? 'x' : 'info-circle'} />
          {t.message}
        </div>
      ))}
    </div>
  )
}
