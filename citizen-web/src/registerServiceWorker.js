export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Citizen service worker registered.')
      }).catch(error => {
        console.error('Citizen service worker registration failed:', error)
      })
    })
  }
}
