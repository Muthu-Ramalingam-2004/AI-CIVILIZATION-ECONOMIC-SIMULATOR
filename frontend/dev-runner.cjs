const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DEFAULT_BACKEND_PORT = 8000;
const FRONTEND_URL = 'http://localhost:5173';

let backendPort = DEFAULT_BACKEND_PORT;
let backendProcess = null;
let backendExited = false;
let backendErrorOutput = '';
let spawnedBackend = false;

// 1. Try to read backend port from ../backend/.env
const backendDir = path.join(__dirname, '..', 'backend');
const envPath = path.join(backendDir, '.env');
if (fs.existsSync(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const portMatch = envContent.match(/^PORT\s*=\s*(\d+)/m);
        if (portMatch && portMatch[1]) {
            backendPort = parseInt(portMatch[1], 10);
        }
    } catch (e) {
        console.error('[Frontend-Runner] Warning: Could not read backend/.env port:', e.message);
    }
}

const HEALTH_URL = `http://127.0.0.1:${backendPort}/api/v1/health`;

function log(prefix, message) {
    console.log(`[${prefix}] ${message}`);
}

function logError(prefix, message) {
    console.error(`[${prefix}] Error: ${message}`);
}

// 2. Check if backend is already running
function checkIsBackendRunning(callback) {
    http.get(HEALTH_URL, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.status === 'healthy') {
                        callback(true);
                        return;
                    }
                } catch (e) {}
            }
            callback(false);
        });
    }).on('error', () => {
        callback(false);
    });
}

// 3. Start backend
function startBackend(callback) {
    let pythonPath = 'python'; // Fallback
    const venvPath = path.join(backendDir, '.venv');
    const windowsPython = path.join(venvPath, 'Scripts', 'python.exe');
    const unixPython = path.join(venvPath, 'bin', 'python');

    if (fs.existsSync(windowsPython)) {
        pythonPath = windowsPython;
    } else if (fs.existsSync(unixPython)) {
        pythonPath = unixPython;
    } else {
        log('Frontend-Runner', 'WARNING: Virtual environment (.venv) not found in backend/.venv. Falling back to system python.');
    }

    log('Frontend-Runner', `Starting FastAPI backend on port ${backendPort}...`);
    spawnedBackend = true;
    backendProcess = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', backendPort.toString(), '--reload'], {
        cwd: backendDir,
        shell: false
    });

    backendProcess.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.log(`[Backend] ${line}`);
        });
    });

    backendProcess.stderr.on('data', (data) => {
        const output = data.toString();
        backendErrorOutput += output;
        const lines = output.trim().split('\n');
        lines.forEach(line => {
            if (line) console.log(`[Backend] ${line}`);
        });
    });

    backendProcess.on('exit', (code) => {
        backendExited = true;
        if (code !== 0 && code !== null) {
            logError('Backend', `Process exited unexpectedly with code ${code}`);
            logError('Backend', 'CRASH DETECTED! Real backend error log below:');
            console.error('==================================================');
            console.error(backendErrorOutput || 'No error output captured.');
            console.error('==================================================');
            cleanupAndExit(code);
        }
    });

    // Wait for backend to become healthy
    let retries = 0;
    const maxRetries = 20; // 20 seconds timeout
    
    function pollHealth() {
        if (backendExited) {
            logError('Frontend-Runner', 'Aborting health check: Backend crashed.');
            return;
        }

        checkIsBackendRunning((healthy) => {
            if (healthy) {
                log('Frontend-Runner', 'Backend is healthy!');
                callback(true);
            } else {
                retries++;
                if (retries >= maxRetries) {
                    logError('Frontend-Runner', 'Backend did not become healthy within timeout. Printing backend output...');
                    console.error('==================================================');
                    console.error(backendErrorOutput || 'No backend error output captured.');
                    console.error('==================================================');
                    cleanupAndExit(1);
                } else {
                    setTimeout(pollHealth, 1000);
                }
            }
        });
    }

    setTimeout(pollHealth, 1000);
}

// 4. Start Vite frontend
function startVite() {
    log('Frontend-Runner', 'Starting Vite frontend...');
    const npmCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    
    const viteProcess = spawn(npmCmd, ['vite'], {
        cwd: __dirname,
        shell: true
    });

    viteProcess.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.log(`[Frontend] ${line}`);
        });
    });

    viteProcess.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.error(`[Frontend-Stderr] ${line}`);
        });
    });

    viteProcess.on('exit', (code) => {
        cleanupAndExit(code || 0);
    });

    // Open browser if backend was started by this script (i.e. not root script)
    // Root script start.js will handle browser opening when started from root.
    // If run from frontend, we open it ourselves.
    if (spawnedBackend) {
        log('Frontend-Runner', `Opening browser to ${FRONTEND_URL}...`);
        setTimeout(() => {
            let openCmd;
            if (process.platform === 'win32') {
                openCmd = `start ${FRONTEND_URL}`;
            } else if (process.platform === 'darwin') {
                openCmd = `open ${FRONTEND_URL}`;
            } else {
                openCmd = `xdg-open ${FRONTEND_URL}`;
            }
            exec(openCmd, (err) => {
                if (err) {
                    logError('Frontend-Runner', `Failed to automatically open browser: ${err.message}`);
                }
            });
        }, 1500);
    }
}

// 5. Orchestration logic
checkIsBackendRunning((alreadyRunning) => {
    if (alreadyRunning) {
        log('Frontend-Runner', `Backend is already running and healthy on port ${backendPort}. Skipping backend start.`);
        startVite();
    } else {
        log('Frontend-Runner', `Backend is not running on port ${backendPort}. Initiating backend startup...`);
        startBackend((success) => {
            if (success) {
                startVite();
            }
        });
    }
});

// Process cleanup on exit/termination
function cleanupAndExit(code = 0) {
    if (backendProcess && !backendExited) {
        log('Frontend-Runner', 'Stopping backend process...');
        try {
            backendProcess.kill();
        } catch (e) {}
    }
    process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));
