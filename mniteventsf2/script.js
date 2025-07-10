
// Configuration - Replace this with your Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysLMHnTC9yzo4SyoaHgyc6b3yRrqWMU6kjUzuFQOI3LTVURbkxL0bMkVnI6e_wljhb/exec';

// Theme management
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = themeToggle.querySelector('span:last-child');

// Load saved theme or default to light (keeping theme in localStorage for better UX)
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeUI(savedTheme);

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
  if (theme === 'dark') {
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light';
  } else {
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Dark';
  }
}

// Firebase Authentication Functions
let currentUser = null;

function sendSignInLinkWithDetails() {
  const name = document.getElementById('name').value.trim();
  const roll = document.getElementById('roll').value.trim();
  const mobile = document.getElementById('mobile').value.trim();
  const email = document.getElementById('email').value.trim();

  // Validate all fields
  if (!name || !roll || !mobile || !email) {
    alert('Please fill in all required fields.');
    return;
  }

  if (!email.endsWith('@mnit.ac.in')) {
    alert('Only MNIT email addresses (@mnit.ac.in) are allowed.');
    return;
  }

  if (mobile.length < 10) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }

  // Store all user details temporarily for completing sign-in
  const tempUserDetails = { name, roll, mobile, email };
  localStorage.setItem('tempUserDetails', JSON.stringify(tempUserDetails));
  localStorage.setItem('emailForSignIn', email);

  // Show loading state
  document.getElementById('login-step-1').style.display = 'none';
  document.getElementById('login-loading').style.display = 'block';
  document.getElementById('login-loading').innerHTML = '<p>Sending verification link to your email...</p>';

  // Send sign-in link using Firebase v8 syntax
  firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      document.getElementById('login-loading').innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 16px;">📧</div>
          <p style="color: var(--primary-blue); font-weight: 600;">✅ Verification link sent!</p>
          <p style="color: var(--text-secondary); margin-top: 8px;">
            Check your email (including spam folder) and click the link to complete login.
          </p>
        </div>
      `;
    })
    .catch((error) => {
      console.error('Error sending email link:', error);
      document.getElementById('login-loading').innerHTML = `
        <p style="color: #ef4444;">❌ Error sending verification link: ${error.message}</p>
        <button class="btn form-btn" onclick="resetLoginForm()">Try Again</button>
      `;
    });
}

function resetLoginForm() {
  document.getElementById('login-step-1').style.display = 'block';
  document.getElementById('login-loading').style.display = 'none';
  document.getElementById('name').value = '';
  document.getElementById('roll').value = '';
  document.getElementById('mobile').value = '';
  document.getElementById('email').value = '';
}

function completeLogin() {
  // Check if user is coming from email link
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    let email = localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }

    if (!email || !email.endsWith('@mnit.ac.in')) {
      alert('Only MNIT email addresses are allowed.');
      return;
    }

    firebase.auth().signInWithEmailLink(email, window.location.href)
      .then((result) => {
        localStorage.removeItem('emailForSignIn');
        currentUser = result.user;

        // Get stored user details
        const tempUserDetails = JSON.parse(localStorage.getItem('tempUserDetails') || 'null');
        const existingUser = JSON.parse(sessionStorage.getItem('userDetails') || 'null');

        if (existingUser && existingUser.email === email) {
          completeUserLogin(existingUser);
        } else if (tempUserDetails && tempUserDetails.email === email) {
          // Use the stored details
          const userDetails = {
            ...tempUserDetails,
            uid: currentUser.uid,
            loginTime: new Date().toISOString()
          };

          sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
          localStorage.removeItem('tempUserDetails');
          completeUserLogin(userDetails);
        } else {
          alert('Error: User details not found. Please try logging in again.');
          resetLoginForm();
        }
      })
      .catch((error) => {
        console.error('Error completing sign-in:', error);
        alert('Error completing login: ' + error.message);
        resetLoginForm();
      });
  }
}

function saveUserInfo() {
  const name = document.getElementById('name').value.trim();
  const roll = document.getElementById('roll').value.trim();
  const mobile = document.getElementById('mobile').value.trim();

  if (name && roll && mobile) {
    if (mobile.length < 10) {
      alert('Please enter a valid mobile number.');
      return;
    }

    const userDetails = {
      name,
      roll,
      mobile,
      email: currentUser.email,
      uid: currentUser.uid,
      loginTime: new Date().toISOString()
    };

    // Store user details in session storage
    sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
    completeUserLogin(userDetails);
  } else {
    alert('Please fill in all fields.');
  }
}

function completeUserLogin(userDetails) {
  const form = document.getElementById('user-form');
  form.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
      <h3 style="color: var(--primary-blue); margin-bottom: 8px;">Welcome to MNIT Events!</h3>
      <p style="color: var(--text-secondary);">Logged in as ${userDetails.name} (${userDetails.email})</p>
    </div>
  `;

  setTimeout(() => {
    form.style.display = 'none';
  }, 2000);
}

function getCurrentUser() {
  const userDetails = sessionStorage.getItem('userDetails');
  if (userDetails && currentUser) {
    return JSON.parse(userDetails);
  }
  return null;
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.email === '2024ucp1237@mnit.ac.in';
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'text/plain', // Changed to text/plain to avoid CORS preflight
      },
      mode: 'cors',
      redirect: 'follow'
    };

    if (method === 'POST' && data) {
      // For POST requests, send as form data to avoid CORS issues
      const formData = new URLSearchParams();
      formData.append('data', JSON.stringify(data));
      options.body = formData;
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    let url = GOOGLE_APPS_SCRIPT_URL;
    if (method === 'GET' && data) {
      const params = new URLSearchParams(data);
      url += '?' + params.toString();
    }

    console.log('Making API call to:', url, 'with method:', method, 'data:', data);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response from server');
    }

    console.log('Parsed API response:', result);

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Notification management
function toggleNotifications() {
  const panel = document.getElementById('notification-panel');
  panel.classList.toggle('show');

  if (panel.classList.contains('show')) {
    loadNotifications();
    markNotificationsAsRead();
  }
}

async function loadNotifications() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const notifications = await apiCall(GOOGLE_APPS_SCRIPT_URL, 'GET', {
      action: 'getNotifications',
      userRoll: user.roll
    });

    const notificationsList = document.getElementById('notifications-list');

    if (notifications.length === 0) {
      notificationsList.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 16px;">🔔</div>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    notificationsList.innerHTML = notifications.map(notification => `
      <div class="notification-item ${notification.read ? '' : 'unread'}">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${formatDate(notification.timestamp)}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
}

async function addNotification(title, message) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    await apiCall(GOOGLE_APPS_SCRIPT_URL, 'POST', {
      action: 'addNotification',
      userRoll: user.roll,
      title: title,
      message: message
    });

    updateNotificationBadge();
  } catch (error) {
    console.error('Failed to add notification:', error);
  }
}

async function markNotificationsAsRead() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    await apiCall(GOOGLE_APPS_SCRIPT_URL, 'POST', {
      action: 'markNotificationsRead',
      userRoll: user.roll
    });

    updateNotificationBadge();
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
}

async function updateNotificationBadge() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const notifications = await apiCall(GOOGLE_APPS_SCRIPT_URL, 'GET', {
      action: 'getNotifications',
      userRoll: user.roll
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');

    if (unreadCount > 0) {
      badge.style.display = 'flex';
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else {
      badge.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to update notification badge:', error);
  }
}

function showAbout() {
  const dropdown = document.getElementById('dropdown-menu');
  dropdown.classList.remove('show');

  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = `
    <div class="event-card" style="max-width: 800px; margin: 0 auto; text-align: center;">
      <div class="event-title">About This Website</div>
      <p style="margin: 20px 0; color: var(--text-secondary); font-size: 1rem;">
        This platform is designed to centralize and simplify all event-related activities within MNIT. <br><br>
        Students can view upcoming events, register for them, and even post their own.
      </p>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        Built with ❤️ by <strong style="color: var(--primary-blue);">Paridhi Parakh</strong>, MNIT Jaipur
        <br>
        Contact: <span style="color: var(--primary-blue); font-weight: 500;">2024ucp1237@mnit.ac.in</span>
      </p>
      <button class="back-btn" onclick="showEvents()">← Back to Events</button>
    </div>
  `;
}

// SMS functionality (simulated)
async function sendSMS(phoneNumber, message) {
  console.log(`SMS sent to ${phoneNumber}: ${message}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
}

// User info management with Firebase authentication
function checkUserLogin() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      const userDetails = sessionStorage.getItem('userDetails');
      if (userDetails) {
        document.getElementById('user-form').style.display = 'none';
      } else {
        // Show step 2 for existing Firebase users without details
        document.getElementById('login-step-2').style.display = 'block';
        document.getElementById('user-form').style.display = 'block';
      }
    } else {
      currentUser = null;
      document.getElementById('user-form').style.display = 'block';
    }
  });
}

async function registerEvent(eventName) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please log in first.');
    document.getElementById('user-form').style.display = 'block';
    return;
  }

  try {
    await apiCall(GOOGLE_APPS_SCRIPT_URL, 'POST', {
      action: 'registerEvent',
      userRoll: user.roll,
      userName: user.name,
      userMobile: user.mobile,
      eventName: eventName
    });

    // Send SMS notification
    sendSMS(user.mobile, `You have successfully registered for ${eventName}. Thank you!`);

    // Add notification
    await addNotification(
      'Registration Successful',
      `You have been registered for ${eventName}`
    );

    alert('Registered successfully!');
  } catch (error) {
    if (error.message === 'Already registered') {
      alert('You are already registered for this event!');
    } else {
      alert('Registration failed. Please try again.');
      console.error('Registration error:', error);
    }
  }
}

async function loadEvents() {
  try {
    const events = await apiCall(GOOGLE_APPS_SCRIPT_URL, 'GET', { action: 'getEvents' });
    return events;
  } catch (error) {
    console.error('Failed to load events:', error);
    return [];
  }
}

function displayEvents(events) {
  const eventsList = document.getElementById('events-list');
  const user = getCurrentUser();
  const adminControls = isAdmin();

  eventsList.innerHTML = events.map(event => `
    <div class="event-card">
      <div class="event-title">${event.title}</div>
      <div class="event-meta">
        <div class="meta-item">📍 ${event.location}</div>
        <div class="meta-item">📅 ${event.date}</div>
        <div class="meta-item">🕔 ${event.time}</div>
        <div class="meta-item">👤 Posted by: ${event.postedByName || event.createdBy}</div>
      </div>
      <div class="event-desc">${event.description}</div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="register-btn" onclick="registerEvent('${event.title}')" style="flex: 1;">Register Now</button>
        ${adminControls || (user && user.roll === event.createdBy) ? `<button class="delete-btn" onclick="deleteEvent(${event.id}, '${event.title.replace(/'/g, "\\'")}')">🗑️</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function showEvents() {
  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '<div class="loading">Loading events...</div>';

  try {
    const events = await loadEvents();
    const filteredEvents = filterExpiredEvents(events);
    displayEvents(filteredEvents);
  } catch (error) {
    eventsList.innerHTML = '<div class="loading">Failed to load events. Please try again.</div>';
  }
}

function filterExpiredEvents(events) {
  const now = new Date();
  return events.filter(event => {
    // Parse event date and time
    const eventDateTime = parseEventDateTime(event.date, event.time);
    if (!eventDateTime) return true; // Keep events if we can't parse the date

    // Add 4 hours to event time
    const expiryTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000));

    // Return true if event hasn't expired yet
    return now < expiryTime;
  });
}

function parseEventDateTime(dateStr, timeStr) {
  try {
    // Handle various date formats
    let eventDate;
    if (dateStr.includes('2024') || dateStr.includes('2025')) {
      eventDate = new Date(dateStr);
    } else {
      // Assume current year if year is not specified
      eventDate = new Date(`${dateStr}, ${new Date().getFullYear()}`);
    }

    // Parse time
    const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const ampm = timeParts[3].toUpperCase();

      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      eventDate.setHours(hours, minutes, 0, 0);
    }

    return eventDate;
  } catch (error) {
    console.error('Error parsing event date/time:', error);
    return null;
  }
}

function showCreateEventForm() {
  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = `
    <div class="event-card" style="max-width: 600px; margin: 0 auto;">
      <div class="event-title">Create New Event</div>
      <form id="create-event-form" style="margin-top: 20px;">
        <input type="text" id="event-title" placeholder="Event Title" required style="margin-bottom: 16px;" />
        <input type="text" id="event-location" placeholder="Location" required style="margin-bottom: 16px;" />
        <input type="date" id="event-date" required style="margin-bottom: 16px;" />
        <input type="time" id="event-time" required style="margin-bottom: 16px;" />
        <textarea id="event-description" placeholder="Event Description" required 
          style="width: 100%; padding: 14px 16px; margin: 8px 0 16px 0; border: 1px solid var(--border-color); 
          border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); 
          font-size: 1rem; min-height: 100px; resize: vertical; font-family: inherit;"></textarea>
        <div style="display: flex; gap: 12px;">
          <button type="submit" class="register-btn" style="flex: 1;">Create Event</button>
          <button type="button" class="register-btn" onclick="showEvents()" 
            style="flex: 1; background: var(--bg-tertiary); color: var(--text-primary);">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('create-event-form').addEventListener('submit', function(e) {
    e.preventDefault();
    createEvent();
  });
}

async function createEvent() {
  const title = document.getElementById('event-title').value.trim();
  const location = document.getElementById('event-location').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const description = document.getElementById('event-description').value.trim();

  if (!title || !location || !date || !time || !description) {
    alert('Please fill in all fields.');
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    alert('Please log in first.');
    document.getElementById('user-form').style.display = 'block';
    return;
  }

  // Validate date is not in the past
  const eventDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  if (eventDateTime < now) {
    alert('Event date and time cannot be in the past.');
    return;
  }

  // Format date for display
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Format time for display
  const timeObj = new Date(`2000-01-01T${time}`);
  const formattedTime = timeObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  try {
    const result = await apiCall(GOOGLE_APPS_SCRIPT_URL, 'POST', {
      action: 'createEvent',
      title: title,
      description: description,
      location: location,
      date: formattedDate,
      time: formattedTime,
      eventDateTime: eventDateTime.toISOString(),
      createdBy: user.roll,
      postedByName: user.name
    });

    console.log('Event creation result:', result);

    // Add notification
    await addNotification(
      'Event Created',
      `Your event "${title}" has been created successfully`
    );

    alert('Event created successfully!');
    showEvents();
  } catch (error) {
    alert(`Failed to create event: ${error.message}`);
    console.error('Create event error:', error);
  }
}

function postEvent() {
  const user = getCurrentUser();
  if (!user) {
    alert('Please log in first.');
    document.getElementById('user-form').style.display = 'block';
    return;
  }
  showCreateEventForm();
}

function toggleDropdown() {
  const dropdown = document.getElementById('dropdown-menu');
  dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
  const dropdown = document.getElementById('dropdown-menu');
  const menuIcon = event.target.closest('.menu-dropdown');

  if (!menuIcon && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});

async function downloadRegistrationsCSV(eventTitle) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const registrations = await apiCall(GOOGLE_APPS_SCRIPT_URL, 'GET', {
      action: 'getRegistrations',
      userRoll: user.roll
    });

    const eventRegistrations = registrations.filter(reg => reg.eventName === eventTitle);

    if (eventRegistrations.length === 0) {
      alert('No registrations found for this event.');
      return;
    }

    // Create CSV content
    const csvHeader = 'Name,Mobile Number,College ID,Registration Date\n';
    const csvContent = eventRegistrations.map(reg =>
      `"${reg.userName}","${reg.userMobile}","${reg.userRoll}","${formatDate(reg.registrationDate)}"`
    ).join('\n');

    const csvData = csvHeader + csvContent;

    // Create and download file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventTitle.replace(/\s+/g, '_')}_registrations.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download registrations:', error);
    alert('Failed to download registrations. Please try again.');
  }
}

async function deleteEvent(eventId, eventTitle) {
  if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
    return;
  }

  const user = getCurrentUser();
  if (!user) return;

  try {
    await apiCall(GOOGLE_APPS_SCRIPT_URL, 'POST', {
      action: 'deleteEvent',
      eventId: eventId,
      eventTitle: eventTitle,
      userRoll: user.roll
    });

    // Add notification
    await addNotification(
      'Event Deleted',
      `Event "${eventTitle}" has been deleted successfully`
    );

    alert('Event deleted successfully!');
    showEvents(); // Refresh the view
  } catch (error) {
    alert('Failed to delete event. Please try again.');
    console.error('Delete event error:', error);
  }
}

async function showHostedEvents() {
  const dropdown = document.getElementById('dropdown-menu');
  dropdown.classList.remove('show');

  const user = getCurrentUser();
  if (!user) {
    alert('Please log in first to view hosted events.');
    document.getElementById('user-form').style.display = 'block';
    return;
  }

  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '<div class="loading">Loading your hosted events...</div>';

  try {
    const userEvents = await apiCall(GOOGLE_APPS_SCRIPT_URL, 'GET', {
      action: 'getHostedEvents',
      userRoll: user.roll
    });

    if (userEvents.length === 0) {
      eventsList.innerHTML = `
        <div class="event-card" style="text-align: center;">
          <button class="back-btn" onclick="showEvents()">← Back to Events</button>
          <div class="event-title">My Hosted Events</div>
          <p style="color: var(--text-secondary); margin-top: 20px;">You haven't created any events yet.</p>
        </div>
      `;
      return;
    }

    let tableContent = `
      <div class="event-card" style="max-width: none;">
        <button class="back-btn" onclick="showEvents()">← Back to Events</button>
        <div class="event-title">My Hosted Events</div>
        <div class="table-container">
          <table class="events-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Total Registrations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
    `;

    userEvents.forEach(event => {
      tableContent += `
        <tr>
          <td>${event.title}</td>
          <td>${event.date} at ${event.time}</td>
          <td>${event.registrationCount}</td>
          <td>
            <button class="download-btn" onclick="downloadRegistrationsCSV('${event.title}')">
              📥 Download CSV
            </button>
            <button class="delete-btn" onclick="deleteEvent(${event.id}, '${event.title.replace(/'/g, "\\'")}')">
              🗑️ Delete
            </button>
          </td>
        </tr>
      `;
    });

    tableContent += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    eventsList.innerHTML = tableContent;
  } catch (error) {
    eventsList.innerHTML = `
      <div class="event-card" style="text-align: center;">
        <button class="back-btn" onclick="showEvents()">← Back to Events</button>
        <div class="event-title">My Hosted Events</div>
        <p style="color: var(--text-secondary); margin-top: 20px;">Failed to load hosted events. Please try again.</p>
      </div>
    `;
    console.error('Failed to load hosted events:', error);
  }
}

async function showMyRegistrations() {
  const dropdown = document.getElementById('dropdown-menu');
  dropdown.classList.remove('show');

  const user = getCurrentUser();
  if (!user) {
    alert('Please log in first to view your registrations.');
    document.getElementById('user-form').style.display = 'block';
    return;
  }

  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '<div class="loading">Loading your registrations...</div>';

  try {
    const userRegistrations = await apiCall(GOOGLE_APPS_SCRIPT_URL, 'GET', {
      action: 'getUserRegistrations',
      userRoll: user.roll
    });

    // Sort by registration date (earliest first)
    userRegistrations.sort((a, b) => new Date(a.registrationDate) - new Date(b.registrationDate));

    if (userRegistrations.length === 0) {
      eventsList.innerHTML = `
        <div class="event-card" style="text-align: center;">
          <button class="back-btn" onclick="showEvents()">← Back to Events</button>
          <div class="event-title">My Registered Events</div>
          <p style="color: var(--text-secondary); margin-top: 20px;">You haven't registered for any events yet.</p>
        </div>
      `;
      return;
    }

    let content = `
      <div class="event-card" style="max-width: none;">
        <button class="back-btn" onclick="showEvents()">← Back to Events</button>
        <div class="event-title">My Registered Events</div>
        <div class="table-container">
          <table class="events-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Registration Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    userRegistrations.forEach(reg => {
      const regDate = new Date(reg.registrationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      content += `
        <tr>
          <td>${reg.eventName}</td>
          <td>${regDate}</td>
          <td><span style="color: var(--primary-blue); font-weight: 600;">Registered ✓</span></td>
        </tr>
      `;
    });

    content += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    eventsList.innerHTML = content;
  } catch (error) {
    eventsList.innerHTML = `
      <div class="event-card" style="text-align: center;">
        <button class="back-btn" onclick="showEvents()">← Back to Events</button>
        <div class="event-title">My Registered Events</div>
        <p style="color: var(--text-secondary); margin-top: 20px;">Failed to load registrations. Please try again.</p>
      </div>
    `;
    console.error('Failed to load user registrations:', error);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    firebase.auth().signOut().then(() => {
      currentUser = null;
      sessionStorage.removeItem('userDetails');

      // Close dropdown
      const dropdown = document.getElementById('dropdown-menu');
      dropdown.classList.remove('show');

      // Show login form
      const userForm = document.getElementById('user-form');
      userForm.style.display = 'block';
      userForm.innerHTML = `
        <h3>Login with MNIT Email</h3>
        <div id="login-step-1">
          <input type="email" id="email" placeholder="Your MNIT Email (@mnit.ac.in)" />
          <button class="btn form-btn" onclick="sendSignInLink()">Send Login Link</button>
        </div>
        <div id="login-step-2" style="display: none;">
          <h3>Enter your details</h3>
          <input type="text" id="name" placeholder="Full Name" />
          <input type="text" id="roll" placeholder="College Roll Number" />
          <input type="tel" id="mobile" placeholder="Mobile Number" />
          <button class="btn form-btn" onclick="saveUserInfo()">Complete Registration</button>
        </div>
        <div id="login-loading" style="display: none; text-align: center; padding: 20px;">
          <p>Check your email for the login link...</p>
        </div>
      `;

      // Go back to events view
      showEvents();
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async function() {
  // Check for email link completion
  completeLogin();

  // Check if user is logged in
  checkUserLogin();

  // Load and display events
  await showEvents();

  // Update notification badge
  await updateNotificationBadge();

  // Add touch feedback for mobile
  const buttons = document.querySelectorAll('.btn, .register-btn, .theme-toggle, .icon');
  buttons.forEach(button => {
    button.addEventListener('touchstart', function() {
      this.style.transform = 'scale(0.95)';
    });
    button.addEventListener('touchend', function() {
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  });
});
