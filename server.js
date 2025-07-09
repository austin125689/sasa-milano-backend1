const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1Ft96E6uFz-hn6Z433hFGa4oLnp0BoMAfdgzc88lYEDc'; // your sheet ID

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
    const duplicate = rows.find(row => row[3] === date && row[4] === time);

    if (duplicate) {
      return res.status(200).json({
        available: false,
        message: 'That time is already booked. Please choose a different time.',
      });
    }
if (!name || !phone || !email || !date || !time || !service || !location) {
  return res.status(400).json({
    message: 'Missing required fields. Please provide name, phone, email, date, time, service, and location.',
  });
}

    if (checkOnly) {
      return res.status(200).json({
        available: true,
        message: 'The slot is available. Should I go ahead and book it for you?',
      });
    }

    if (!name || !phone || !email || !service || !location) {
      return res.status(400).json({ message: 'Missing required fields to book.' });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Appointments!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, phone, email, date, time, service, location]],
      },
    });

    res.status(200).json({ available: true, message: 'Your appointment has been booked successfully.' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Something went wrong while checking the appointment.' });
  }
res.status(500).json({ message: 'Something went wrong while booking. Please try again later.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
