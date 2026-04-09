const fs = require('fs');
const path = require('path');
const files = [
  'users/users.controller.ts',
  'translations/translations.controller.ts',
  'testimonials/testimonials.controller.ts',
  'support/support.controller.ts',
  'monitoring/monitoring.controller.ts',
  'jobs/jobs.controller.ts',
  'images/images.controller.ts',
  'favorites/favorites.controller.ts',
  'content/content.controller.ts',
  'dashboard/dashboard.controller.ts',
  'companies/companies.controller.ts',
  'chat/chat.controller.ts',
  'audit-logs/ai-smart.controller.ts', // This might be audit-logs/audit-logs.controller.ts actually? Let's use glob instead.
  'auth/auth.controller.ts',
  'app.controller.ts',
  'applications/applications.controller.ts',
  'ai-chatbot/ai-chatbot.controller.ts'
];

function findControllers(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findControllers(filePath, fileList);
    } else if (file.endsWith('.controller.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allControllers = findControllers('src');
let res = '';

allControllers.forEach(f => {
  const content = fs.readFileSync(f, 'utf-8');
  res += '==========\\nModule: ' + f + '\\n';
  const lines = content.split('\\n');
  let ctrlName = '';
  lines.forEach(l => {
    const m = l.match(/@Controller\(['"](.*?)['"]\)/);
    if(m) ctrlName = m[1];
    
    const m2 = l.match(/@(Get|Post|Put|Patch|Delete)\(['"]([^'"]*)['"]\)/);
    if(m2) {
        let route = ctrlName ? '/' + ctrlName : '';
        if (m2[2]) route += (route.endsWith('/') || m2[2].startsWith('/') ? '' : '/') + m2[2];
        if (route === '') route = '/';
        res += '  ' + m2[1].toUpperCase() + ' ' + route + '\\n';
    } else {
        const m3 = l.match(/@(Get|Post|Put|Patch|Delete)\(\)/);
        if(m3) {
            let route = ctrlName ? '/' + ctrlName : '/';
            res += '  ' + m3[1].toUpperCase() + ' ' + route + '\\n';
        }
    }
  });
});

fs.writeFileSync('routes.txt', res);
console.log('Done extraction.');
