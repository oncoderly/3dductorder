// Environment configuration
// Production ortamında debug tool'ları devre dışı bırakır

export const ENV = {
  // URL'de ?debug=true varsa veya localhost'ta çalışıyorsa dev mode
  isDevelopment: () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    const debugParam = urlParams.get('debug') === 'true';

    return isLocalhost || debugParam;
  },

  // Production ortamında mı?
  isProduction: () => {
    return !ENV.isDevelopment();
  },

  // Debug console'u yükle (sadece dev'de)
  loadDebugConsole: () => {
    if (ENV.isDevelopment()) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eruda';
      script.onload = () => {
        if (window.eruda) {
          window.eruda.init();
          console.log('🔧 Eruda debug console loaded (development mode)');
        }
      };
      document.head.appendChild(script);
    } else {
      console.log('✅ Production mode - debug console disabled');
    }
  }
};
