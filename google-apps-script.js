

// Google Apps Script Web App Backend for MNIT Events Platform
// Deploy this as a Web App to handle frontend requests

function doGet(e) {
  const action = e.parameter.action;

  try {
    switch (action) {
      case 'getEvents':
        return ContentService.createTextOutput(JSON.stringify(getEvents()))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'getHostedEvents':
        const userRoll = e.parameter.userRoll;
        return ContentService.createTextOutput(JSON.stringify(getHostedEvents(userRoll)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'getNotifications':
        const notifUserRoll = e.parameter.userRoll;
        return ContentService.createTextOutput(JSON.stringify(getNotifications(notifUserRoll)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'getUserRegistrations':
        const regUserRoll = e.parameter.userRoll;
        return ContentService.createTextOutput(JSON.stringify(getUserRegistrations(regUserRoll)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'getRegistrations':
        const hostUserRoll = e.parameter.userRoll;
        return ContentService.createTextOutput(JSON.stringify(getRegistrations(hostUserRoll)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      default:
        return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");

    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type");

  }
}

function doPost(e) {
  try {
    let data;

    // Handle both JSON and form data
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        // Try to parse as form data
        if (e.parameter && e.parameter.data) {
          data = JSON.parse(e.parameter.data);
        } else {
          throw new Error('Invalid request format');
        }
      }
    } else if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else {
      throw new Error('No data provided');
    }

    const action = data.action;

    switch (action) {
      case 'createEvent':
        return ContentService.createTextOutput(JSON.stringify(createEvent(data)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'registerEvent':
        return ContentService.createTextOutput(JSON.stringify(registerEvent(data)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'deleteEvent':
        return ContentService.createTextOutput(JSON.stringify(deleteEvent(data)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'addNotification':
        return ContentService.createTextOutput(JSON.stringify(addNotification(data)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      case 'markNotificationsRead':
        return ContentService.createTextOutput(JSON.stringify(markNotificationsRead(data)))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");


      default:
        return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeader("Access-Control-Allow-Origin", "*")
          .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          .setHeader("Access-Control-Allow-Headers", "Content-Type");

    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type");

  }
}

// Handle preflight OPTIONS requests
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");

}

// Replace with your actual spreadsheet ID
const SPREADSHEET_ID = '1sqy60A03pbCs2GX00N3W4LFkNlAAvyL83QaImPzfQd8';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);

    // Add headers based on sheet type
    if (sheetName === 'Events') {
      sheet.getRange(1, 1, 1, 9).setValues([['ID', 'Title', 'Description', 'Location', 'Date', 'Time', 'CreatedBy', 'PostedByName', 'EventDateTime']]);
    } else if (sheetName === 'Registrations') {
      sheet.getRange(1, 1, 1, 5).setValues([['UserRoll', 'UserName', 'UserMobile', 'EventName', 'RegistrationDate']]);
    } else if (sheetName === 'Notifications') {
      sheet.getRange(1, 1, 1, 5).setValues([['UserRoll', 'Title', 'Message', 'Timestamp', 'Read']]);
    }
  }

  return sheet;
}

function getEvents() {
  const sheet = getOrCreateSheet('Events');
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  const events = [];
  for (let i = 1; i < data.length; i++) {
    events.push({
      id: data[i][0],
      title: data[i][1],
      description: data[i][2],
      location: data[i][3],
      date: data[i][4],
      time: data[i][5],
      createdBy: data[i][6],
      postedByName: data[i][7] || data[i][6], // Fallback to createdBy if name not available
      eventDateTime: data[i][8] || ''
    });
  }

  return events;
}

function createEvent(eventData) {
  const sheet = getOrCreateSheet('Events');
  const lastRow = sheet.getLastRow();
  const eventId = lastRow;

  sheet.appendRow([
    eventId,
    eventData.title,
    eventData.description,
    eventData.location,
    eventData.date,
    eventData.time,
    eventData.createdBy,
    eventData.postedByName || '',
    eventData.eventDateTime || ''
  ]);

  return { success: true, eventId: eventId };
}

function registerEvent(regData) {
  const regSheet = getOrCreateSheet('Registrations');
  const data = regSheet.getDataRange().getValues();

  // Check if already registered
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === regData.userRoll && data[i][3] === regData.eventName) {
      throw new Error('Already registered');
    }
  }

  regSheet.appendRow([
    regData.userRoll,
    regData.userName,
    regData.userMobile,
    regData.eventName,
    new Date().toISOString()
  ]);

  return { success: true };
}

function deleteEvent(deleteData) {
  const sheet = getOrCreateSheet('Events');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == deleteData.eventId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return { success: true };
}

function getHostedEvents(userRoll) {
  const eventsSheet = getOrCreateSheet('Events');
  const regSheet = getOrCreateSheet('Registrations');

  const eventsData = eventsSheet.getDataRange().getValues();
  const regData = regSheet.getDataRange().getValues();

  const hostedEvents = [];

  for (let i = 1; i < eventsData.length; i++) {
    if (eventsData[i][6] === userRoll) {
      // Count registrations for this event
      let regCount = 0;
      for (let j = 1; j < regData.length; j++) {
        if (regData[j][3] === eventsData[i][1]) {
          regCount++;
        }
      }

      hostedEvents.push({
        id: eventsData[i][0],
        title: eventsData[i][1],
        description: eventsData[i][2],
        location: eventsData[i][3],
        date: eventsData[i][4],
        time: eventsData[i][5],
        registrationCount: regCount
      });
    }
  }

  return hostedEvents;
}

function getUserRegistrations(userRoll) {
  const sheet = getOrCreateSheet('Registrations');
  const data = sheet.getDataRange().getValues();

  const registrations = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userRoll) {
      registrations.push({
        userRoll: data[i][0],
        userName: data[i][1],
        userMobile: data[i][2],
        eventName: data[i][3],
        registrationDate: data[i][4]
      });
    }
  }

  return registrations;
}

function getRegistrations(userRoll) {
  const eventsSheet = getOrCreateSheet('Events');
  const regSheet = getOrCreateSheet('Registrations');

  const eventsData = eventsSheet.getDataRange().getValues();
  const regData = regSheet.getDataRange().getValues();

  // Get events created by this user
  const userEvents = [];
  for (let i = 1; i < eventsData.length; i++) {
    if (eventsData[i][6] === userRoll) {
      userEvents.push(eventsData[i][1]); // Event title
    }
  }

  // Get registrations for user's events
  const registrations = [];
  for (let i = 1; i < regData.length; i++) {
    if (userEvents.includes(regData[i][3])) {
      registrations.push({
        userRoll: regData[i][0],
        userName: regData[i][1],
        userMobile: regData[i][2],
        eventName: regData[i][3],
        registrationDate: regData[i][4]
      });
    }
  }

  return registrations;
}

function addNotification(notifData) {
  const sheet = getOrCreateSheet('Notifications');

  sheet.appendRow([
    notifData.userRoll,
    notifData.title,
    notifData.message,
    new Date().toISOString(),
    false // unread
  ]);

  return { success: true };
}

function getNotifications(userRoll) {
  const sheet = getOrCreateSheet('Notifications');
  const data = sheet.getDataRange().getValues();

  const notifications = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userRoll) {
      notifications.push({
        userRoll: data[i][0],
        title: data[i][1],
        message: data[i][2],
        timestamp: data[i][3],
        read: data[i][4]
      });
    }
  }

  // Sort by timestamp (newest first)
  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return notifications;
}

function markNotificationsRead(data) {
  const sheet = getOrCreateSheet('Notifications');
  const sheetData = sheet.getDataRange().getValues();

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === data.userRoll) {
      sheet.getRange(i + 1, 5).setValue(true); // Mark as read
    }
  }

  return { success: true };
}

