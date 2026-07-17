const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DEFAULT_BACKEND_PORT = 8000;
const FRONTEND_URL = 'http://localhost:5173';

let backendPort = DEFAULT_BACKEND_PORT;
let backendProcess = null;
let frontendProcess = null;
let backendExited = false;
let backendExitCode = null;
let backendErrorOutput = '';
let spawnedBackend = false;
let healthCheckTimer = null;
let healthCheckTimeout = null;

function log(prefix, message) {
    console.log(`[${prefix}] ${message}`);
}

function logError(prefix, message) {
    console.error(`[${prefix}] Error: ${message}`);
}

// 1. Try to read backend port from backend/.env
const backendDir = path.join(__dirname, 'backend');
const envPath = path.join(backendDir, '.env');
if (fs.existsSync(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const portMatch = envContent.match(/^PORT\s*=\s*(\d+)/m);
        if (portMatch && portMatch[1]) {
            backendPort = parseInt(portMatch[1], 10);
        }
    } catch (e) {
        logError('Startup', `Could not read backend/.env port: ${e.message}`);
    }
}

const HEALTH_URL = `http://127.0.0.1:${backendPort}/api/v1/health`;

// 2. Health check helper
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

// 3. Start the process
function run() {
    checkIsBackendRunning((alreadyRunning) => {
        if (alreadyRunning) {
            log('Startup', `Backend is already running and healthy on port ${backendPort}. Skipping backend startup.`);
            startFrontend();
        } else {
            log('Startup', `Backend is not running on port ${backendPort}. Starting backend...`);
            startBackend();
        }
    });
}

function startBackend() {
    let pythonPath = 'python'; // Fallback to system python
    const venvPath = path.join(backendDir, '.venv');
    const windowsPython = path.join(venvPath, 'Scripts', 'python.exe');
    const unixPython = path.join(venvPath, 'bin', 'python');

    if (fs.existsSync(windowsPython)) {
        pythonPath = windowsPython;
        log('Startup', `Using virtual environment python: ${pythonPath}`);
    } else if (fs.existsSync(unixPython)) {
        pythonPath = unixPython;
        log('Startup', `Using virtual environment python: ${pythonPath}`);
    } else {
        log('Startup', 'WARNING: Virtual environment (.venv) not found in backend/.venv. Falling back to system python.');
    }

    spawnedBackend = true;
    backendProcess = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', backendPort.toString(), '--reload'], {
        cwd: backendDir,
        shell: false
    });

    backendProcess.on('error', (err) => {
        logError('Backend', `Failed to start backend process: ${err.message}`);
        cleanupAndExit(1);
    });

    // Capture backend output
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
        backendExitCode = code;
        if (code !== 0 && code !== null) {
            logError('Backend', `Process exited unexpectedly with code ${code}`);
            logError('Backend', 'CRASH DETECTED! Real backend error log below:');
            console.error('==================================================');
            console.error(backendErrorOutput || 'No error output captured.');
            console.error('==================================================');
            cleanupAndExit(code);
        }
    });

    // Set a 20-second timeout for backend health
    healthCheckTimeout = setTimeout(() => {
        logError('Startup', 'Backend health check timed out after 20 seconds. Aborting...');
        console.error('==================================================');
        console.error(backendErrorOutput || 'No backend error output captured.');
        console.error('==================================================');
        cleanupAndExit(1);
    }, 20000);

    // Poll health check
    log('Startup', 'Waiting for backend health check...');
    
    function pollHealth() {
        if (backendExited) {
            if (healthCheckTimeout) clearTimeout(healthCheckTimeout);
            logError('Startup', 'Aborting health check: Backend crashed.');
            return;
        }

        checkIsBackendRunning((healthy) => {
            if (healthy) {
                if (healthCheckTimeout) clearTimeout(healthCheckTimeout);
                log('Startup', 'Backend is healthy! Starting Vite frontend...');
                startFrontend();
            } else {
                healthCheckTimer = setTimeout(pollHealth, 1000);
            }
        });
    }

    pollHealth();
}

function startFrontend() {
    const frontendDir = path.join(__dirname, 'frontend');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    // Note: since we changed frontend dev script to run dev-runner.js,
    // here we run "npx vite" or similar directly to avoid infinite looping,
    // OR we run "npm run dev" knowing that dev-runner.js will check the backend,
    // see that it's healthy, and start vite. Spawning "npm run dev" is perfectly fine.
    frontendProcess = spawn(npmCmd, ['run', 'dev'], {
        cwd: frontendDir,
        shell: true
    });

    frontendProcess.on('error', (err) => {
        logError('Frontend', `Failed to start frontend process: ${err.message}`);
        cleanupAndExit(1);
    });

    frontendProcess.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.log(`[Frontend] ${line}`);
        });
    });

    frontendProcess.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.error(`[Frontend-Stderr] ${line}`);
        });
    });

    frontendProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            logError('Frontend', `Process exited with code ${code}`);
            cleanupAndExit(code);
        }
    });

    // 5. Open frontend in browser only after backend is verified healthy
    log('Startup', `Opening browser to ${FRONTEND_URL}...`);
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
                logError('Startup', `Failed to automatically open browser: ${err.message}`);
            }
        });
    }, 1500); // Small delay to let Vite spin up
}

// Process cleanup on exit/termination
function cleanupAndExit(code = 0) {
    log('Startup', 'Shutting down processes...');
    if (healthCheckTimeout) clearTimeout(healthCheckTimeout);
    if (healthCheckTimer) clearTimeout(healthCheckTimer);
    
    if (backendProcess && !backendExited) {
        try {
            backendProcess.kill();
        } catch (e) {}
    }
    if (frontendProcess) {
        try {
            frontendProcess.kill();
        } catch (e) {}
    }
    process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));

run();
