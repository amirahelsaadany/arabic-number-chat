# Arabic Number Chat

صفحة شات بسيطة (RTL) بتاخد رسالة فيها أرقام وترجعها بعد ما تحول الأرقام لكلمات عربية.

مثال:
```
موعدك الساعة 9:30 والفاتورة 5000 ريال
→ موعدك الساعة تسع ونص والفاتورة خمسة آلاف ريال
```

بيغطي الأوقات (زي 9:30، 9:45)، الكسور (3.5، 0.75)، والأرقام الكبيرة (5000، 1,250,000).

## التشغيل

محتاجة Node.js مثبت عندك (node -v للتأكد).

```bash
git clone <repo-link>
cd arabic-number-chat
npm install
npm start
```

بعدها افتحي المتصفح على `http://localhost:3000` وجربي.

## الملفات

- `server.js` - سيرفر express بسيط، فيه endpoint واحد POST /api/message
- `src/arabicNumbers.js` - منطق تحويل الأرقام (الجزء الأساسي)
- `public/index.html` - واجهة الشات
- `test-manual.js` - تشغليه بـ `npm test` لو حابة تشوفي أمثلة تحويل بسرعة
