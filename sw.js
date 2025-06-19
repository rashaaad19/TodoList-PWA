self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification('Task Reminder', {
            body: event.data.title,
            // icon: '/icons/icon-192.png', // optional
            tag: 'task-reminder'
        });
    }
});
