const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetPattern1 = /\{\s*themeMode === 'dark' \? <LinearGradient colors=\{\['#090514', '#0c0a1a', '#02010a'\]\} locations=\{\[0, 0\.5, 1\]\} style=\{StyleSheet\.absoluteFill\} \/> : null\s*\}\s*\{\s*themeMode === 'dark' \? <RadialGlowOrb color="rgba\(99,102,241,0\.6\)" size=\{500\} style=\{\{ top: -150, right: -150 \}\} \/> : null\s*\}\s*\{\s*themeMode === 'dark' \? <RadialGlowOrb color="rgba\(168,85,247,0\.5\)" size=\{500\} style=\{\{ bottom: -50, left: -200 \}\} \/> : null\s*\}\s*\{\s*themeMode === 'dark' \? <BlurView intensity=\{50\} tint="dark" style=\{StyleSheet\.absoluteFill\} \/> : null\s*\}/g;

const targetPattern2 = /\{\s*themeMode === 'dark' \? <LinearGradient colors=\{\['#090514', '#0c0a1a', '#02010a'\]\} style=\{StyleSheet\.absoluteFill\} \/> : null\s*\}\s*\{\s*themeMode === 'dark' \? <RadialGlowOrb color="rgba\(99,102,241,0\.4\)" size=\{400\} style=\{\{ top: '25%', left: '15%' \}\} \/> : null\s*\}/g;

walkDir(path.join(__dirname, 'app'), (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  // Exclude login, index, register which have custom animatable backgrounds
  if (filePath.includes('login.tsx') || filePath.includes('index.tsx') || filePath.includes('register.tsx') || filePath.includes('InstructorHome.tsx') || filePath.includes('StudentDashboard.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace standard background pattern with nothing (we will wrap the return instead)
  let hasReplaced = false;
  
  if (content.match(targetPattern1)) {
    content = content.replace(targetPattern1, '');
    hasReplaced = true;
  }

  if (hasReplaced) {
    // Need to wrap the main container with ScreenBackground
    // Find the main return (
    //   <View style={styles.container}>
    // or similar
    const returnPattern = /return\s*\(\s*<View\s+style=\{([^}]+)\}\s*>/;
    const match = content.match(returnPattern);
    
    if (match) {
        const styleProp = match[1];
        // Replace <View style={...}> with <ScreenBackground style={...}>
        content = content.replace(returnPattern, `return (\n    <ScreenBackground style={${styleProp}}>`);
        
        // Replace the closing </View> corresponding to it.
        // Assuming it's the last </View> in the component or file.
        const lastViewIndex = content.lastIndexOf('</View>');
        if (lastViewIndex !== -1) {
            content = content.substring(0, lastViewIndex) + '</ScreenBackground>' + content.substring(lastViewIndex + 7);
        }
        
        // Add imports
        if (!content.includes('import ScreenBackground')) {
            // Find relative path to src/components/ScreenBackground
            const depth = filePath.split(path.sep).length - path.join(__dirname, 'app').split(path.sep).length;
            const prefix = depth === 1 ? '../' : depth === 2 ? '../../' : '../../../';
            content = content.replace("import React", `import React from 'react';\nimport ScreenBackground from '${prefix}src/components/ScreenBackground';\n// `);
        }
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});
