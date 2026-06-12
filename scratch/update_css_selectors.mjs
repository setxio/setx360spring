import fs from 'fs';
import path from 'path';

const workspaceRoot = 'c:\\Users\\montg\\OneDrive\\Desktop\\SETX 360 Final';

const filesToUpdate = [
  'src/components/LocalActionAgent.css',
  'src/components/MediaView.css',
  'src/components/ProductSearch.css',
  'src/components/HomesView.css',
  'src/components/TravelView.css',
  'src/components/ClassifiedsView.css',
  'src/components/AutoView.css',
  'src/components/ProductCardElite.css',
  'src/index.css'
];

for (const relPath of filesToUpdate) {
  const filePath = path.join(workspaceRoot, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace:
  // .light-theme .xyz,
  // [data-theme="light"] .xyz {
  // or variations
  content = content.replace(/\.light-theme\s+([^,]+),\s*\[data-theme=["']light["']\]\s+([^ \t\r\n{]+)/g, '[data-theme*="light"] $1');

  // Replace exact data-theme="light" or data-theme='light' selectors to data-theme*="light"
  content = content.replace(/\[data-theme=["']light["']\]/g, '[data-theme*="light"]');

  // Replace exact data-theme="dark" or data-theme='dark' selectors to data-theme*="dark"
  content = content.replace(/\[data-theme=["']dark["']\]/g, '[data-theme*="dark"]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated: ${relPath}`);
  } else {
    console.log(`No changes needed for: ${relPath}`);
  }
}
