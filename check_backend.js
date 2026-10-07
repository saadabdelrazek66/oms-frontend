const fs = require('fs');
const path = require('path');

const candidates = [
  'C:\\xampp\\htdocs\\oms\\oms-backend',
  'C:\\xampp\\htdocs\\oms-backend',
  'C:\\xampp\\htdocs\\oms'
];

for (const c of candidates) {
  if (fs.existsSync(c)) {
    console.log('Exists:', c);
    const rulePath = path.join(c, 'app', 'Rules', 'ValidDriveFolderLink.php');
    if (fs.existsSync(rulePath)) {
      console.log('Rule found at:', rulePath);
      console.log('Content:\n', fs.readFileSync(rulePath, 'utf8'));
    }
  }
}
