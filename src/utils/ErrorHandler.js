// Error Handler - Kullanıcı dostu hata mesajları

export class ErrorHandler {
  constructor() {
    this.errorContainer = null;
    this.setupErrorContainer();
  }

  setupErrorContainer() {
    // Hata mesajları için container oluştur
    this.errorContainer = document.createElement('div');
    this.errorContainer.id = 'error-container';
    this.errorContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.errorContainer);
  }

  showError(message, details = null, type = 'error') {
    const errorEl = document.createElement('div');
    errorEl.className = `error-toast error-${type}`;
    errorEl.style.cssText = `
      background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                    type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                    'linear-gradient(135deg, #6366f1, #4f46e5)'};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(239, 68, 68, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.2);
      pointer-events: auto;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.5;
    `;

    const icon = type === 'error' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️';

    errorEl.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 24px; flex-shrink: 0;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 700; margin-bottom: 4px;">${message}</div>
          ${details ? `<div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">${details}</div>` : ''}
        </div>
        <button style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.2)'"
           onmouseout="this.style.background='none'"
           onclick="this.closest('.error-toast').remove()">×</button>
      </div>
    `;

    // Animasyon CSS'i ekle (sadece bir kere)
    if (!document.getElementById('error-animations')) {
      const style = document.createElement('style');
      style.id = 'error-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    this.errorContainer.appendChild(errorEl);

    // Click'te kapat
    errorEl.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        errorEl.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => errorEl.remove(), 300);
      }
    });

    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
      if (errorEl.parentElement) {
        errorEl.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => errorEl.remove(), 300);
      }
    }, 5000);

    // Console'a da log'la
    console.error(`[${type.toUpperCase()}]`, message, details || '');
  }

  // Hata tipleri için yardımcı metodlar
  error(message, details = null) {
    this.showError(message, details, 'error');
  }

  warning(message, details = null) {
    this.showError(message, details, 'warning');
  }

  info(message, details = null) {
    this.showError(message, details, 'info');
  }

  // Critical hatalar için - sayfa yenileme önerisi
  critical(message, details = null) {
    this.showError(
      message,
      `${details || ''}\n\nSayfa yenilenecek...`,
      'error'
    );

    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
}

// Global error handler
export function setupGlobalErrorHandler(errorHandler) {
  // Uncaught errors
  window.addEventListener('error', (event) => {
    errorHandler.error(
      'Beklenmeyen bir hata oluştu',
      `${event.message} (${event.filename}:${event.lineno})`
    );
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.error(
      'İşlem tamamlanamadı',
      event.reason?.message || String(event.reason)
    );
  });
}
