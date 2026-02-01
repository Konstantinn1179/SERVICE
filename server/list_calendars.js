const { google } = require('googleapis');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Path to the service account key
const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const targetCalendarId = '0498b68ab83a47baff332a395b803ce5d73c969d721929ba8fd6f2325bef926d@group.calendar.google.com'; // Using the correct Calendar ID

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(__dirname, keyPath),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

async function checkCalendarAccess() {
  try {
    console.log(`Checking access for Calendar ID: ${targetCalendarId}...`);
    const res = await calendar.calendars.get({ calendarId: targetCalendarId });
    console.log('✅ Success! Found calendar:');
    console.log(`Summary: ${res.data.summary}`);
    console.log(`ID: ${res.data.id}`);
    console.log(`Timezone: ${res.data.timeZone}`);
  } catch (err) {
    console.error('❌ Failed to access calendar with email ID.');
    console.error(`Error Code: ${err.code}`);
    console.error(`Message: ${err.message}`);
    
    if (err.code === 404) {
      console.log('\nAnalysis: A 404 error means either:');
      console.log('1. The calendar ID is incorrect (The "ЦЕНТР АКПП" calendar is likely a secondary calendar with a different ID).');
      console.log('2. The service account does not have access to it (though the screenshot suggests it does).');
      console.log('\nRecommendation: Please find the "Calendar ID" in the Google Calendar settings for "ЦЕНТР АКПП". It usually looks like "long_string@group.calendar.google.com".');
    }
  }
}

checkCalendarAccess();
