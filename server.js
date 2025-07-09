const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1Ft96E6uFz-hn6Z433hFGa4oLnp0BoMAfdgzc88lYEDc';

app.post('/api/appointments', async (req, res) => {
  try {
    const { appointment_type, date, time, location_type, name, phone, email } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Appointments!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          appointment_type,
          date,
          time,
          location_type,
          name,
          phone,
          email
        ]],
      },
    });

    res.status(200).json({ message: '✅ Appointment saved to Google Sheet' });
  } catch (err) {
    console.error('❌ Error saving to Google Sheet:', err);
    res.status(500).json({ error: 'Failed to save appointment' });
  }
});

app.get('/', (req, res) => {
  res.send('🟢 SASA Milano backend is connected to Google Sheets!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
