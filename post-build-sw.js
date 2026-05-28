import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swPath = path.resolve(__dirname, 'dist/sw.js');

try {
  if (fs.existsSync(swPath)) {
    let content = fs.readFileSync(swPath, 'utf8');
    const target = 'importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js")';
    const replacement = 'try { importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js") } catch(e) { console.warn("OneSignal SW load blocked:", e); }';
    
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(swPath, content, 'utf8');
      console.log('Successfully wrapped OneSignal importScripts in try-catch inside dist/sw.js');
    } else {
      console.warn('OneSignal import script target not found in sw.js');
    }
  } else {
    console.error('sw.js not found in dist folder');
  }
} catch (error) {
  console.error('Error modifying sw.js:', error);
}
