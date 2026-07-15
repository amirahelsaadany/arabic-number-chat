const { convertTextNumbers } = require('./src/arabicNumbers');

const cases = [
  'موعدك الساعة 9:30 والفاتورة 5000 ريال',
  'الاجتماع الساعة 14:45',
  'السعر 3.5 ريال فقط',
  'عندي 1000000 ريال في الحساب',
  'الرقم 21 والرقم 100 والرقم 3',
  'الساعة الآن 12:00 بالضبط',
  'الفاتورة 1,250,000 ريال',
  'الوقت المتبقي 7:15 دقيقة',
  'النسبة 0.75 من المشروع',
  'عدد الطلاب 11 طالب و2 معلمين',
];

for (const c of cases) {
  console.log('IN :', c);
  console.log('OUT:', convertTextNumbers(c));
  console.log('---');
}
