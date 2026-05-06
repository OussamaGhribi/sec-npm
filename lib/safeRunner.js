import vm from 'node:vm';
import path from 'path';

const HONEY_TRAPS = [
  '/root/.ssh/id_rsa',
  '/home/user/.ssh/id_rsa',
  '.env',
  '/etc/passwd',
  '/etc/shadow',
  '~/.aws/credentials',
  '~/.npmrc'
];

export async function runInShadowSandbox(scriptContent, options = {}) {
  const anomalies = [];

  const createProxy = (name, realModule) => {
    return new Proxy(realModule, {
      get(target, prop) {
        if (['readFile', 'readFileSync', 'access', 'accessSync', 'stat', 'statSync'].includes(prop)) {
          return (...args) => {
            const filePath = args[0];
            if (typeof filePath === 'string') {
              if (HONEY_TRAPS.some(trap => filePath.includes(trap))) {
                anomalies.push(`[HONEY-TRAP]: Script tried to read sensitive file: ${filePath}`);
              } else {
                anomalies.push(`Attempted access: ${name}.${String(prop)} on ${filePath}`);
              }
            }
            return null;
          };
        }

        if (typeof target[prop] === 'function') {
          return (...args) => {
            anomalies.push(`Blocked execution: ${name}.${String(prop)}(${args.map(a => typeof a === 'string' ? `'${a}'` : typeof a).join(', ')})`);
            return null;
          };
        }
        return target[prop];
      }
    });
  };

  const context = {
    console: {
      log: () => {},
      error: () => {},
      warn: () => {}
    },
    process: {
      env: { ...process.env, NODE_ENV: 'production' },
      argv: ['node', 'install.js'],
      exit: (code) => { anomalies.push(`Process tried to exit with code ${code}`); },
      cwd: () => '/sandbox',
      on: () => {}
    },
    require: (moduleName) => {
      anomalies.push(`Required module: ${moduleName}`);
      if (['fs', 'child_process', 'net', 'http', 'https', 'dns'].includes(moduleName)) {
        return createProxy(moduleName, {});
      }
      return {};
    },
    setTimeout,
    clearTimeout,
    Buffer
  };

  try {
    const script = new vm.Script(scriptContent);
    const vmContext = vm.createContext(context);
    script.runInContext(vmContext, { timeout: 2000 });
  } catch (err) {
    anomalies.push(`Execution error: ${err.message}`);
  }

  return anomalies;
}
