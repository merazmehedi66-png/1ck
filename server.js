require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let pendingRegistrations = {};

app.post('/register', (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password || password.length < 8) {
    return res.status(400).json({ success: false, message: "Valid phone and min 8 char password required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  pendingRegistrations[phone] = { password, otp, timestamp: Date.now() };

  const message = `🆕 **New Registration Request**\n\n📱 Phone: ${phone}\n🔑 System OTP: ${otp}\n\nএই OTP ইউজারের নাম্বারে পাঠাও।`;

  bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });

  res.json({ success: true, message: "OTP generated" });
});

app.post('/verify', (req, res) => {
  const { phone, enteredOtp } = req.body;

  if (!pendingRegistrations[phone]) {
    return res.json({ success: false, message: "Request expired" });
  }

  const data = pendingRegistrations[phone];
  const isMatch = data.otp === enteredOtp;

  const notify = `🔍 **User Code Received**\n\n📱 Phone: ${phone}\n🔢 Entered: ${enteredOtp}\n✅ Correct OTP: ${data.otp}\n📊 Match: ${isMatch ? '✅ YES' : '❌ NO'}\n\nBoss, reply with "verified" or "not verified"`;

  bot.sendMessage(CHAT_ID, notify, { parse_mode: 'Markdown' });

  res.json({ 
    success: isMatch, 
    message: isMatch ? "Code matched. Waiting for approval." : "আপনার কোডটি সঠিক নয়।" 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
