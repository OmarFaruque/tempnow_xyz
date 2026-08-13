const fs = require('fs');
const path = require('path');

function replaceInDir(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (file === 'node_modules' || file === '.next' || file === '.git') {
        return;
      }
      replaceInDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace imports starting with '@/
      const updatedContent = content
        .replace(/from\s+['"]@\/([^'"]+)['"]/g, "from '@letterise/$1'")
        .replace(/import\s+['"]@\/([^'"]+)['"]/g, "import '@letterise/$1'")
        .replace(/import\((['"])@\/([^'"]+)(['"])\)/g, "import($1@letterise/$2$3)");

      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        console.log(`Updated imports in: ${fullPath}`);
      }
    }
  });
}

const targetDirs = [
  path.join(__dirname, '../app/ai-documents'),
  path.join(__dirname, '../app/administrator/ai-documents'),
  path.join(__dirname, '../letterise-hh')
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Replacing imports in ${dir}...`);
    replaceInDir(dir);
  } else {
    console.log(`Directory does not exist: ${dir}`);
  }
});
