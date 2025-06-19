var idbApp = (function () {
    'use strict';


    // Check for service worker and notification support
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') {
                alert('Please allow notifications to receive task reminders.');
            }
        });
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.error('SW registration failed:', err));
    }



    var dbPromise = idb.open('Tasks', 1, function (db) {
        if (!db.objectStoreNames.contains('Todos')) {
            var todosStore = db.createObjectStore('Todos', { keyPath: 'id' });
            todosStore.createIndex('title', 'title', { unique: true });
        }
    });

    function addTodoToDB(task) {
        dbPromise.then(db => {
            const tx = db.transaction('Todos', 'readwrite');
            const store = tx.objectStore('Todos');
            store.put(task);
            return tx.complete;
        }).then(() => {
            console.log('Task saved to IndexedDB:', task);
        }).catch(err => {
            console.error('Failed to save task to IndexedDB:', err);
        });
    }

    function displayTask(task) {
        const tasksContainer = document.getElementById('tasksContainer');
    
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.setAttribute('data-id', task.id);
    
        const title = document.createElement('span');
        title.textContent = task.title;
    
        const date = document.createElement('span');
        date.className = 'task-date';
        const formattedDate = `${task.year}-${String(task.month).padStart(2, '0')}-${String(task.day).padStart(2, '0')} ${String(task.hours).padStart(2, '0')}:${String(task.minutes).padStart(2, '0')}`;
        date.textContent = ` (Due: ${formattedDate})`;
    
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = function () {
            deleteTask(task.id);
            taskElement.remove();
        };
    
        taskElement.appendChild(title);
        taskElement.appendChild(date);
        taskElement.appendChild(deleteBtn);
        tasksContainer.appendChild(taskElement);
    }
    

    function deleteTask(id) {
        dbPromise.then(db => {
            const tx = db.transaction('Todos', 'readwrite');
            const store = tx.objectStore('Todos');
            store.delete(id);
            return tx.complete;
        }).then(() => {
            console.log(`Task with ID ${id} deleted`);
        }).catch(err => {
            console.error('Failed to delete task:', err);
        });
    }

    function submitForm(event) {
        event.preventDefault();

        const taskTitle = document.getElementById('taskTitle').value;
        const hours = parseInt(document.getElementById('hours').value);
        const minutes = parseInt(document.getElementById('minutes').value);
        const day = parseInt(document.getElementById('day').value);
        const month = parseInt(document.getElementById('month').value) - 1;
        const year = parseInt(document.getElementById('year').value);

        const taskTime = new Date(year, month, day, hours, minutes).getTime();
        console.log(`Task time: ${new Date(taskTime).toLocaleString()}, Current time: ${new Date(Date.now()).toLocaleString()}`);
        const now = Date.now();
        const delay = taskTime - now;

        const task = {
            id: Date.now(),
            title: taskTitle,
            hours,
            minutes,
            day,
            month: month + 1,
            year
        };

        addTodoToDB(task);
        displayTask(task);
        
        document.getElementById('todoForm').reset();

        if (delay > 0) {
            setTimeout(() => {
                // Send message to service worker to show notification
                if ('serviceWorker' in navigator && 'Notification' in window) {
                    navigator.serviceWorker.ready.then(sw => {
                        sw.active.postMessage({
                            type: 'SHOW_NOTIFICATION',
                            title: task.title
                        });
                    });
                }

                //  Mark task as done in the UI
                const taskEl = document.querySelector(`[data-id="${task.id}"]`);
                if (taskEl) {
                    taskEl.classList.add('done');
                }

            }, delay);
        }
    }

    return {
        submitForm: submitForm
    };
})();
