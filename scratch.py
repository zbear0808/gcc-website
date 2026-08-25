import re

with open('src/components/ControllerVisualizer.tsx', 'r') as f:
    content = f.read()

content = content.replace("import React from 'react';", "import React from 'react';\nimport styles from '@/assets/styles/components/visualizer.module.css';")

def replacer_literal(match):
    classes = match.group(1).split()
    mapped = ' '.join([f"${{styles['{c}'] || '{c}'}}" for c in classes])
    return f"className={{`{mapped}`}}"

content = re.sub(r'className="([^"]+)"', replacer_literal, content)

def replacer_expr(match):
    expr = match.group(1)
    
    # We want to replace any string literals in the expression that look like class names
    # e.g. 'theme-' -> won't match our regex if we look for word boundaries, but let's just do:
    # return expr but replacing 'has-firefox' with styles['has-firefox']
    # A simple way for visualizer is just finding literal classes and replacing them.
    # Actually, it's easier to just use standard React pattern:
    # className={`${styles['controller-map']} ${config.buttons ? styles['theme-' + config.buttons] : ''}`}
    # But writing a perfect parser is hard. Let's just do a manual replace for the few dynamic ones.
    pass

with open('src/components/ControllerVisualizer.tsx', 'w') as f:
    f.write(content)
