const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/ControllerVisualizer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/import React from 'react';/, "import React from 'react';\nimport styles from '@/assets/styles/components/visualizer.module.css';");

// Use regex to replace className="..." with className={styles["..."]}
// Also need to handle template literals like className={`foo ${bar}`} -> className={`${styles.foo} ${bar}`}

// Function to convert className string to styles
content = content.replace(/className="([^"]+)"/g, (match, classes) => {
  const parts = classes.split(' ');
  const styled = parts.map(p => `\${styles['${p}'] || '${p}'}`).join(' ');
  return `className={\`${styled}\`}`;
});

// For template literals className={`...`}
content = content.replace(/className=\{`([^`]+)`\}/g, (match, expr) => {
  // This is a bit tricky, let's just do a simple replacement for word characters outside of ${}
  let newExpr = expr;
  
  // Find all literal class words and wrap them
  // We can do this by splitting around ${...} blocks, processing literals, then joining
  const segments = [];
  let currentLiteral = '';
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === '$' && expr[i+1] === '{') {
      if (currentLiteral) {
        segments.push({ type: 'literal', value: currentLiteral });
        currentLiteral = '';
      }
      let braceCount = 1;
      let j = i + 2;
      while (j < expr.length && braceCount > 0) {
        if (expr[j] === '{') braceCount++;
        else if (expr[j] === '}') braceCount--;
        j++;
      }
      segments.push({ type: 'expr', value: expr.substring(i, j) });
      i = j;
    } else {
      currentLiteral += expr[i];
      i++;
    }
  }
  if (currentLiteral) {
    segments.push({ type: 'literal', value: currentLiteral });
  }

  const finalSegments = segments.map(seg => {
    if (seg.type === 'literal') {
      return seg.value.split(/\s+/).filter(Boolean).map(c => `\${styles['${c}'] || '${c}'}`).join(' ') + (seg.value.endsWith(' ') ? ' ' : '');
    } else {
      // It's an expression like ${foo ? 'bar' : ''}
      // If it returns class names, it won't be mapped. But for visualizer, we can just map the literal parts and assume dynamic parts are mapped manually or they are globals.
      // Wait, has-firefox, has-wavedash etc are dynamic. We should map those too.
      return seg.value.replace(/'([\w-]+)'/g, (m, c) => `styles['${c}'] || '${c}'`).replace(/"([\w-]+)"/g, (m, c) => `styles['${c}'] || '${c}'`);
    }
  });

  return `className={\`${finalSegments.join(' ')}\`}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
