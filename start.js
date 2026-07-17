const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BACKEND_PORT = 8000;
const FRONTEND_URL = 'http://localhost:5173';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/api/v1/health`;

let backendProcess = null;
let frontendProcess = null;
let backendExited = false;
let backendExitCode = null;
let backendErrorOutput = '';

function log(prefix, message) {
    console.log(`[${prefix}] ${message}`);
}

function logError(prefix, message) {
    console.error(`[${prefix}] Error: ${message}`);
}

// 1. Activate backend virtual environment & find python path
const backendDir = path.join(__dirname, 'backend');
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

// 2. Start FastAPI backend
log('Startup', 'Starting FastAPI backend on port 8000...');
backendProcess = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', BACKEND_PORT.toString(), '--reload'], {
    cwd: backendDir,
    shell: false
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

// 3. Wait for backend to be healthy
function checkHealth(callback) {
    if (backendExited) {
        logError('Startup', 'Aborting health check: Backend crashed.');
        return;
    }

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
                } catch (e) {
                    // JSON parsing failed, but got 200 OK
                }
            }
            // Retry
            setTimeout(() => checkHealth(callback), 1000);
        });
    }).on('error', (err) => {
        // Connection refused, server is starting up. Wait and retry.
        setTimeout(() => checkHealth(callback), 1000);
    });
}

log('Startup', 'Waiting for backend health check...');
checkHealth((healthy) => {
    if (!healthy) return;

    log('Startup', 'Backend is healthy! Starting Vite frontend...');

    // 4. Start Vite frontend
    const frontendDir = path.join(__dirname, 'frontend');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    frontendProcess = spawn(npmCmd, ['run', 'dev'], {
        cwd: frontendDir,
        shell: true
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

    // 5. Open frontend in browser
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
});

// Process cleanup on exit/termination
function cleanupAndExit(code = 0) {
    log('Startup', 'Shutting down processes...');
    if (backendProcess) {
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
