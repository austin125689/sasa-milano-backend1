const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Load Google Sheets credentials from env variable
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Set up Sheets API auth
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const spreadsheetId = '1Ft96E6uFz-hn6Z433hFGa4oLnp0BoMAfdgzc88lYEDc'; // Your sheet ID

app.post('/api/appointments', async (req, res) => {
  const { name, phone, email, date, time, service, location, checkOnly } = req.body;

  if (!date || !time) {
    return res.status(400).json({ message: 'Date and time are required.' });
  }

  try {
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Appointments!A2:G',
    });

    const rows = readResponse.data.values || [];

    // Check for duplicate time slot
    const duplicate = rows.find(row => row[3] === date && row[4] === time);

    if (duplicate) {
      return res.status(200).json({
        available: false,
        message: 'That time slot is already booked. Please choose a different time.',
      });
    }

    // If we're just checking availability
    if (checkOnly) {
      return res.status(200).json({
        available: true,
        message: 'The slot is available. Should I go ahead and book it for you?',
      });
    }

    // Validate required fields for actual booking
    if (!name || !phone || !email || !service || !location) {
      return res.status(400).json({
        available: false,
        message: 'Missing required fields. Please provide name, phone, email, service, and location.',
      });
    }

    // Save new appointment
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Appointments!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, phone, email, date, time, service, location]],
      },
    });

    return res.status(200).json({
      available: true,
      message: 'Your appointment has been booked successfully.',
    });

  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({
      available: false,
      message: 'Something went wrong while booking. Please try again later.',
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
