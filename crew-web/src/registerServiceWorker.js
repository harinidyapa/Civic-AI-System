export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Crew service worker registered.')
      }).catch(error => {
        console.error('Crew service worker registration failed:', error)
      })
    })
  }
}
