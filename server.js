'use strict';

const express = require('express');
const path = require('path');
const { convertTextNumbers } = require('./src/arabicNumbers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/message  { text: "موعدك الساعة 9:30" }
// -> { original: "...", converted: "موعدك الساعة تسع ونص" }
app.post('/api/message', (req, res) => {
  const { text } = req.body || {};

  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'الرجاء إرسال نص صالح في الحقل "text".' });
  }

  const converted = convertTextNumbers(text);
  return res.json({ original: text, converted });
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
