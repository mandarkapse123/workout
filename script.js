const backgrounds = {
    Legs: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
    Pull: 'https://images.unsplash.com/photo-1530822847156-097df527899d?q=80&w=2070&auto=format&fit=crop',
    Push: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2070&auto=format&fit=crop',
    Cardio: 'https://images.unsplash.com/photo-1557339352-11d7e7aa85ae?q=80&w=2072&auto=format&fit=crop',
    Rest: 'https://images.unsplash.com/photo-1506126611913-1ce16dad848f?q=80&w=2070&auto=format&fit=crop'
};

function setBackground() {
    try {
        const today = new Date().getDay();
        const schedule = [
            document.getElementById('sun').textContent,
            document.getElementById('mon').textContent,
            document.getElementById('tue').textContent,
            document.getElementById('wed').textContent,
            document.getElementById('thu').textContent,
            document.getElementById('fri').textContent,
            document.getElementById('sat').textContent
        ];
        const workout = schedule[today];
        document.body.style.backgroundImage = `url(${backgrounds[workout] || backgrounds.Rest})`;
    } catch (e) {
        console.error('Background error:', e);
        document.body.style.background = '#333';
    }
}
setBackground();

// Tab switching
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'progress') {
        loadProgress();
    }
}

// Dialog control
function showDialog() {
    document.getElementById('dialog').style.display = 'block';
}

function closeDialog() {
    document.getElementById('dialog').style.display = 'none';
}

function submitWorkout() {
    const type = document.getElementById('workoutType').value;
    const exercise = document.getElementById('exerciseName').value;
    const sets = document.getElementById('sets').value;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        .replace(/(\d+)/, '$1th').replace('th', match => match === '1th' ? '1st' : match === '2th' ? '2nd' : match === '3th' ? '3rd' : 'th');
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (!exercise || !sets) {
        alert('Please fill in all fields!');
        return;
    }

    const data = { date, day, type, exercise, sets };
    saveToSheets(data);
    closeDialog();
}

// Google Sheets integration
function saveToSheets(data) {
    const url = 'https://script.google.com/macros/s/AKfycbyFvHkef74IRUoFwAm5D7G9Q4YV0BrrettsG5NuM6BlUZ2zogh9B22EzHtgWKKacUvY/exec'; // Replace with your URL
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        console.log('Data saved to Sheets');
    }).catch(err => console.error('Error:', err));
}

function loadProgress() {
    const url = 'https://script.google.com/macros/s/AKfycbyFvHkef74IRUoFwAm5D7G9Q4YV0BrrettsG5NuM6BlUZ2zogh9B22EzHtgWKKacUvY/exec'; // Same URL
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('progressBody');
            tbody.innerHTML = '';
            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.date}</td><td>${row.day}</td><td>${row.type}</td><td>${row.exercise}</td><td>${row.sets}</td>`;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error('Error loading progress:', err);
            document.getElementById('progressBody').innerHTML = '<tr><td colspan="5">Error loading data</td></tr>';
        });
}

// Schedule editing
function toggleEditSchedule() {
    const form = document.getElementById('editScheduleForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveSchedule() {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    days.forEach(day => {
        const input = document.getElementById(`${day}Input`).value.trim();
        if (input) {
            document.getElementById(day).textContent = input;
            document.getElementById(`${day}Input`).value = '';
        }
    });
    setBackground(); // Update background after schedule change
    toggleEditSchedule();
}
