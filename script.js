const backgrounds = {
    Legs: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
    Pull: 'https://images.unsplash.com/photo-1530822847156-097df527899d?q=80&w=2070&auto=format&fit=crop',
    Push: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2070&auto=format&fit=crop',
    Cardio: 'https://images.unsplash.com/photo-1557339352-11d7e7aa85ae?q=80&w=2072&auto=format&fit=crop',
    Rest: 'https://images.unsplash.com/photo-1506126611913-1ce16dad848f?q=80&w=2070&auto=format&fit=crop'
};

const exercisesByType = {
    Pull: ['Lat Pulldowns', 'Seated Cable Pulls', 'Iso-Lateral Rowing', 'Standing T-Bar Row', 'Dumbbell Curl', 'Standing Barbell Curl', 'Seated Arm Curl'],
    Push: ['Incline Dumbbell Press', 'Flat Bench Press', 'Cable Fly', 'Triceps Pushdown', 'EZ Bar Skull Crushers', 'Dumbbell Shoulder Press', 'Lateral Raises'],
    Legs: ['Barbell Back Squats', 'Leg Press', 'Romanian Deadlifts', 'Hip Thrusts', 'Seated Leg Extensions', 'Seated Leg Curls', 'Hip Abductor'],
    Cardio: ['Treadmill']
};

let recentLogs = JSON.parse(localStorage.getItem('recentLogs')) || [];
let streak = parseInt(localStorage.getItem('streak')) || 0;
let lastLogDate = localStorage.getItem('lastLogDate') || null;

function setBackgroundBasedOnType() {
    const type = document.getElementById('workoutType')?.value || 'Rest';
    document.body.style.backgroundImage = `url(${backgrounds[type] || backgrounds.Rest})`;
}

function setBackground() {
    try {
        const today = new Date().getDay();
        const schedule = [
            document.getElementById('sun')?.textContent || 'Rest',
            document.getElementById('mon')?.textContent || 'Legs',
            document.getElementById('tue')?.textContent || 'Pull',
            document.getElementById('wed')?.textContent || 'Push',
            document.getElementById('thu')?.textContent || 'Legs',
            document.getElementById('fri')?.textContent || 'Pull',
            document.getElementById('sat')?.textContent || 'Push'
        ];
        const workout = schedule[today];
        document.body.style.backgroundImage = `url(${backgrounds[workout] || backgrounds.Rest})`;
        if (document.getElementById('todayExercise')) {
            document.getElementById('todayExercise').textContent = workout;
        }
    } catch (e) {
        console.error('Background error:', e);
        document.body.style.background = '#333';
    }
}

function filterExercises() {
    const type = document.getElementById('workoutType').value;
    const exerciseDropdown = document.getElementById('exerciseName');
    exerciseDropdown.innerHTML = '';
    const exercises = exercisesByType[type] || [];
    exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        exerciseDropdown.appendChild(option);
    });
    setBackgroundBasedOnType();
    document.getElementById('suggestion').textContent = `Try: ${exercises[0] || 'something new'} for ${type}!`;
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
    document.getElementById('workoutType').selectedIndex = 0;
    filterExercises();
    document.getElementById('sets').selectedIndex = 0;

    // Gamification: Update streak
    const today = new Date().toDateString();
    if (lastLogDate) {
        const last = new Date(lastLogDate);
        const diff = (new Date(today) - last) / (1000 * 60 * 60 * 24);
        if (diff === 1) streak++;
        else if (diff > 1) streak = 1;
    } else {
        streak = 1;
    }
    lastLogDate = today;
    localStorage.setItem('streak', streak);
    localStorage.setItem('lastLogDate', lastLogDate);
    showNotification(`Workout logged! Streak: ${streak} days`);
}

function saveToSheets(data) {
    const url = 'https://script.google.com/macros/s/AKfycbwsZmB9riRAee2RLnKwlGY6Hovyaj7saCoCc8CjJLl1qCO9i5RY4R2NzBvMx_CkHRG3/exec';
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        console.log('Data saved to Sheets');
        recentLogs.unshift(data);
        recentLogs = recentLogs.slice(0, 3);
        localStorage.setItem('recentLogs', JSON.stringify(recentLogs));
        const recentLogsDiv = document.getElementById('recentLogs');
        if (recentLogsDiv) {
            recentLogsDiv.innerHTML = '<h3 class="text-lg font-bold">Recent Logs</h3>' + 
                recentLogs.map(log => `<p>${log.date}: ${log.type} - ${log.exercise} (${log.sets} sets)</p>`).join('');
        }
    }).catch(err => console.error('Error:', err));
}

function loadProgress() {
    const url = 'https://script.google.com/macros/s/AKfycbwsZmB9riRAee2RLnKwlGY6Hovyaj7saCoCc8CjJLl1qCO9i5RY4R2NzBvMx_CkHRG3/exec';
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

            const setsByType = {};
            data.forEach(row => {
                setsByType[row.type] = (setsByType[row.type] || 0) + parseInt(row.sets);
            });
            const ctx = document.getElementById('progressChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(setsByType),
                    datasets: [{
                        label: 'Total Sets',
                        data: Object.values(setsByType),
                        backgroundColor: ['#4CAF50', '#8792eb', '#F59E0B', '#EF4444'],
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });

            const gamificationDiv = document.getElementById('gamification');
            gamificationDiv.innerHTML = `<p class="text-lg font-bold">Streak: ${streak} days</p>` +
                (streak >= 5 ? '<p>🏅 Consistency Badge Earned!</p>' : '');
        })
        .catch(err => {
            console.error('Error:', err);
            document.getElementById('progressBody').innerHTML = '<tr><td colspan="5">Error loading data</td></tr>';
        });
}

function toggleEditSchedule() {
    const form = document.getElementById('editScheduleForm');
    form.classList.toggle('hidden');
}

function saveSchedule() {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    days.forEach(day => {
        const input = document.getElementById(`${day}Input`)?.value.trim();
        if (input) {
            document.getElementById(day).textContent = input;
            document.getElementById(`${day}Input`).value = '';
        }
    });
    setBackground();
    toggleEditSchedule();
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// Page-specific initialization
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    setBackground();
} else if (window.location.pathname.includes('log.html')) {
    filterExercises();
} else if (window.location.pathname.includes('progress.html')) {
    setBackground();
    loadProgress();
}
