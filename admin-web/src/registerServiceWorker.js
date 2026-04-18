export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Admin service worker registered.')
      }).catch(error => {
        console.error('Admin service worker registration failed:', error)
      })
    })
  }
}
