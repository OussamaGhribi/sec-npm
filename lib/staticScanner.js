import fs from 'fs';
import path from 'path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

function calculateEntropy(str) {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

const SENSITIVE_APIS = [
  'eval', 'Function', 'exec', 'spawn', 'fork', 'execFile',
  'writeFile', 'writeFileSync', 'appendFile', 'chmod', 'chown',
  'connect', 'createServer', 'createConnection'
];

const SENSITIVE_MODULES = [
  'child_process', 'fs', 'net', 'http', 'https', 'dns', 'tls', 'crypto'
];

function resolveStringValue(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const left = resolveStringValue(node.left);
    const right = resolveStringValue(node.right);
    if (typeof left === 'string' && typeof right === 'string') {
      return left + right;
    }
  }
  return null;
}

function isHexEncoded(str) {
  return /^[0-9a-fA-F]+$/.test(str) && str.length > 20;
}

export async function scanDirectory(dirPath) {
  const findings = [];
  const files = getAllFiles(dirPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(dirPath, file);
    
    try {
      const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
      
      walk.simple(ast, {
        Literal(node) {
          if (typeof node.value === 'string') {
            const entropy = calculateEntropy(node.value);
            
            if (entropy > 4.5 && node.value.length > 50) {
              findings.push({
                file: relativePath,
                type: 'High Entropy String',
                detail: `Possible obfuscation detected (entropy: ${entropy.toFixed(2)})`,
              });
            }

            if (isHexEncoded(node.value)) {
              findings.push({
                file: relativePath,
                type: 'Hex Encoded String',
                detail: 'Suspicious long hex-encoded string detected.',
              });
            }
          }
        },
        CallExpression(node) {
          let moduleName = null;
          if (node.callee.name === 'require') {
            moduleName = resolveStringValue(node.arguments[0]);
          }

          if (moduleName && SENSITIVE_MODULES.includes(moduleName)) {
            findings.push({
              file: relativePath,
              type: 'Sensitive Module Import',
              detail: `Importing ${moduleName} (De-obfuscated)`,
            });
          }

          if (node.callee.type === 'Identifier' && SENSITIVE_APIS.includes(node.callee.name)) {
            findings.push({
              file: relativePath,
              type: 'Sensitive API Call',
              detail: `Direct call to ${node.callee.name}`,
            });
          }
          
          if (node.callee.type === 'MemberExpression' && 
              node.callee.object.name === 'Buffer' && 
              node.callee.property.name === 'from') {
              findings.push({
                file: relativePath,
                type: 'Dynamic Payload Construction',
                detail: 'Using Buffer.from to construct dynamic content.',
              });
          }
        },
        MemberExpression(node) {
          if (node.object.name === 'process' && node.property.name === 'env') {
            findings.push({
              file: relativePath,
              type: 'Environment Access',
              detail: 'Accessing process.env (potential sensitive data leak)',
            });
          }
        }
      });
    } catch (err) {
      findings.push({
        file: relativePath,
        type: 'Parse Error',
        detail: 'Could not parse file. It might be heavily obfuscated or use non-standard syntax.'
      });
    }
  }

  return findings;
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}
