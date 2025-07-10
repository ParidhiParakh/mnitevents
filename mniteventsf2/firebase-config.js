// Firebase Configuration - Using Firebase v8 syntax
const firebaseConfig = {
  apiKey: "AIzaSyAG7_fOOHCk3ZDxlmZygr3FIDkpzSoomOg",
  authDomain: "mnitevents.firebaseapp.com",
  projectId: "mnitevents",
  storageBucket: "mnitevents.firebasestorage.app",
  messagingSenderId: "287195331489",
  appId: "1:287195331489:web:2d5e957baf47648d63e9e0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Action code settings for email link
const actionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true
};

// Make auth globally available
window.auth = auth;
window.actionCodeSettings = actionCodeSettings;

// Send email link for authentication
async function sendEmailLink(email) {
  if (!email.endsWith('@mnit.ac.in')) {
    throw new Error('Only MNIT email addresses are allowed');
  }

  try {
    await auth.sendSignInLinkToEmail(email, actionCodeSettings);
    // Save email to local storage for the sign-in process
    window.localStorage.setItem('emailForSignIn', email);
    return true;
  } catch (error) {
    console.error('Error sending email link:', error);
    throw error;
  }
}

// Complete sign-in with email link
async function completeSignIn() {
  if (auth.isSignInWithEmailLink(window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your MNIT email address');
    }

    if (!email || !email.endsWith('@mnit.ac.in')) {
      throw new Error('Only MNIT email addresses are allowed');
    }

    try {
      const result = await auth.signInWithEmailLink(email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      return result;
    } catch (error) {
      console.error('Error completing sign-in:', error);
      throw error;
    }
  }
  return null;
}

// Sign out user
async function signOutUser() {
  try {
    await auth.signOut();
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Check if user is admin
function isAdmin(email) {
  return email === '2024ucp1237@mnit.ac.in';
}

window.sendEmailLink = sendEmailLink;
window.completeSignIn = completeSignIn;
window.signOutUser = signOutUser;
window.isAdmin = isAdmin;