// child-bridge.js
// Çocuk iframe ile ana sayfa arasında iletişim köprüsü

// Parametreler objesi - 3D sahne parametrelerini tutar
window.P = window.P || {};

// Ana sayfaya hazır olduğunu bildir
function notifyReady() {
  try {
    parent.postMessage({
      type: 'child-ready',
      title: document.title
    }, '*');
  } catch(e) {
    console.log('Parent communication failed:', e);
  }
}

// Ana sayfadan gelen mesajları dinle
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'getState') {
    // Mevcut parametreleri ve küçük resmi gönder
    try {
      const response = {
        type: 'state',
        params: window.P || {},
        thumb: null // İsteğe bağlı: canvas'tan küçük resim
      };
      parent.postMessage(response, '*');
    } catch(e) {
      console.log('State response failed:', e);
    }
  }
});

// Sayfa yüklendiğinde hazır olduğunu bildir
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', notifyReady);
} else {
  notifyReady();
}