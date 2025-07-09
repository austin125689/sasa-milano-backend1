const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Load Google credentials from environment variable
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const spreadsheetId = '1Ft96E6uFz-hn6Z433hFGa4oLnp0BoMAfdgzc88lYEDc'; // your sheet ID

app.post('/api/appointments', async (req, res) => {
  const { name, phone, email, date, time, service, location } = req.body;

  if (!name || !phone || !email || !date || !time || !service || !location) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Check for duplicate appointment
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Appointments!A2:G',
    });

    const rows = readResponse.data.values || [];

    const duplicate = rows.find(row => row[3] === date && row[4] === time);

    if (duplicate) {
      return res.status(409).json({
        message: 'That time slot is already booked. Please choose another.',
      });
    }

    // Add appointment
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Appointments!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, phone, email, date, time, service, location]],
      },
    });

    res.status(200).json({ message: 'Appointment booked successfully.' });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Something went wrong while booking.' });
  }
});

app.get('/', (req, res) => {
  res.send('SASA Milano Custom Appointment API is running.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
