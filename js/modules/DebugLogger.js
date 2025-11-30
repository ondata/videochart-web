/**
 * DebugLogger Module
 * Handles debug logging and frame capture for testing
 */

export class DebugLogger {
    constructor(enabled = false) {
        this.enabled = enabled;
        this.sessionId = this.generateSessionId();
        this.logs = [];
        this.frames = [];
        this.config = null;
        this.data = null;
        this.startTime = null;
        this.metadata = {};
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `test-${timestamp}`;
    }

    /**
     * Enable debug mode
     */
    enable() {
        this.enabled = true;
        this.log('DEBUG', 'Debug mode enabled');
    }

    /**
     * Disable debug mode
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Check if debug is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Start a new debug session
     */
    startSession() {
        this.sessionId = this.generateSessionId();
        this.logs = [];
        this.frames = [];
        this.startTime = performance.now();
        this.log('SESSION', `Started session: ${this.sessionId}`);
    }

    /**
     * Log a message
     * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG, etc.)
     * @param {string} message - Log message
     * @param {Object} data - Optional data object
     */
    log(level, message, data = null) {
        if (!this.enabled) return;

        const timestamp = performance.now();
        const elapsed = this.startTime ? (timestamp - this.startTime).toFixed(2) : '0.00';

        const logEntry = {
            timestamp: new Date().toISOString(),
            elapsed: `${elapsed}ms`,
            level,
            message,
            data: data ? JSON.parse(JSON.stringify(data)) : null
        };

        this.logs.push(logEntry);

        // Also log to console with color
        const colors = {
            INFO: 'color: #2196F3',
            WARN: 'color: #FF9800',
            ERROR: 'color: #F44336',
            DEBUG: 'color: #4CAF50',
            SESSION: 'color: #9C27B0',
            ANIMATION: 'color: #00BCD4',
            RENDER: 'color: #FFC107',
            RECORD: 'color: #E91E63'
        };

        console.log(
            `%c[${level}] ${elapsed}ms: ${message}`,
            colors[level] || 'color: #666',
            data || ''
        );
    }

    /**
     * Capture a frame from canvas
     * @param {HTMLCanvasElement} canvas - Canvas to capture
     * @param {string} name - Frame name/description
     * @param {number} frameNumber - Frame number in sequence
     */
    async captureFrame(canvas, name, frameNumber) {
        if (!this.enabled) return;

        try {
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });

            const frame = {
                number: frameNumber,
                name,
                timestamp: new Date().toISOString(),
                elapsed: this.startTime ? (performance.now() - this.startTime).toFixed(2) : '0',
                blob,
                size: blob.size,
                dimensions: {
                    width: canvas.width,
                    height: canvas.height
                }
            };

            this.frames.push(frame);

            this.log('RENDER', `Captured frame #${frameNumber}: ${name}`, {
                size: `${(blob.size / 1024).toFixed(2)} KB`,
                dimensions: `${canvas.width}x${canvas.height}`
            });
        } catch (error) {
            this.log('ERROR', `Failed to capture frame #${frameNumber}`, { error: error.message });
        }
    }

    /**
     * Save configuration
     */
    saveConfig(config) {
        if (!this.enabled) return;
        this.config = JSON.parse(JSON.stringify(config));
        this.log('DEBUG', 'Configuration saved', config);
    }

    /**
     * Save data
     */
    saveData(data) {
        if (!this.enabled) return;
        this.data = JSON.parse(JSON.stringify(data));
        this.log('DEBUG', 'Data saved', {
            countries: data.countries?.length || 0,
            values: data.gdp?.length || 0
        });
    }

    /**
     * Add metadata
     */
    addMetadata(key, value) {
        if (!this.enabled) return;
        this.metadata[key] = value;
        this.log('DEBUG', `Metadata: ${key}`, { value });
    }

    /**
     * Get logs as text
     */
    getLogsAsText() {
        let text = `Debug Session: ${this.sessionId}\n`;
        text += `Generated: ${new Date().toISOString()}\n`;
        text += `Total Logs: ${this.logs.length}\n`;
        text += `Total Frames: ${this.frames.length}\n`;
        text += `\n${'='.repeat(80)}\n\n`;

        if (this.metadata && Object.keys(this.metadata).length > 0) {
            text += `METADATA:\n`;
            for (const [key, value] of Object.entries(this.metadata)) {
                text += `  ${key}: ${JSON.stringify(value)}\n`;
            }
            text += `\n`;
        }

        text += `LOGS:\n\n`;

        for (const log of this.logs) {
            text += `[${log.timestamp}] [${log.elapsed}] [${log.level}] ${log.message}\n`;
            if (log.data) {
                text += `  Data: ${JSON.stringify(log.data, null, 2)}\n`;
            }
            text += `\n`;
        }

        return text;
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        return {
            sessionId: this.sessionId,
            totalLogs: this.logs.length,
            totalFrames: this.frames.length,
            duration: this.startTime ? (performance.now() - this.startTime).toFixed(2) : 0,
            logsByLevel: this.logs.reduce((acc, log) => {
                acc[log.level] = (acc[log.level] || 0) + 1;
                return acc;
            }, {}),
            totalFrameSize: this.frames.reduce((sum, f) => sum + f.size, 0)
        };
    }

    /**
     * Download logs as text file
     */
    downloadLogs() {
        const text = this.getLogsAsText();
        const blob = new Blob([text], { type: 'text/plain' });
        this.downloadBlob(blob, `${this.sessionId}-logs.txt`);
    }

    /**
     * Download configuration
     */
    downloadConfig() {
        if (!this.config) {
            this.log('WARN', 'No configuration to download');
            return;
        }

        const json = JSON.stringify(this.config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadBlob(blob, `${this.sessionId}-config.json`);
    }

    /**
     * Download data
     */
    downloadData() {
        if (!this.data) {
            this.log('WARN', 'No data to download');
            return;
        }

        const json = JSON.stringify(this.data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadBlob(blob, `${this.sessionId}-data.json`);
    }

    /**
     * Download specific frame
     */
    downloadFrame(frameNumber) {
        const frame = this.frames.find(f => f.number === frameNumber);
        if (!frame) {
            this.log('WARN', `Frame #${frameNumber} not found`);
            return;
        }

        this.downloadBlob(frame.blob, `${this.sessionId}-frame-${String(frameNumber).padStart(4, '0')}.png`);
    }

    /**
     * Download all frames as individual files
     */
    async downloadAllFrames() {
        if (this.frames.length === 0) {
            this.log('WARN', 'No frames to download');
            return;
        }

        this.log('INFO', `Downloading ${this.frames.length} frames...`);

        for (let i = 0; i < this.frames.length; i++) {
            const frame = this.frames[i];
            await new Promise(resolve => setTimeout(resolve, 100)); // Delay between downloads
            this.downloadBlob(
                frame.blob,
                `${this.sessionId}-frame-${String(frame.number).padStart(4, '0')}.png`
            );
        }

        this.log('INFO', 'All frames downloaded');
    }

    /**
     * Create and download debug package with all data
     */
    async downloadDebugPackage() {
        this.log('INFO', 'Creating debug package...');

        // Create summary file
        const summary = this.getSummary();
        const summaryText = `Debug Session Summary
${'='.repeat(80)}

Session ID: ${summary.sessionId}
Duration: ${summary.duration}ms
Total Logs: ${summary.totalLogs}
Total Frames: ${summary.totalFrames}
Total Frame Size: ${(summary.totalFrameSize / 1024 / 1024).toFixed(2)} MB

Logs by Level:
${Object.entries(summary.logsByLevel).map(([level, count]) => `  ${level}: ${count}`).join('\n')}

Files in this package:
- summary.txt (this file)
- logs.txt (detailed logs)
- config.json (chart configuration)
- data.json (input data)
- frame-XXXX.png (captured frames)

${'='.repeat(80)}
`;

        // Download each file separately with session prefix
        this.downloadBlob(new Blob([summaryText], { type: 'text/plain' }), `${this.sessionId}-summary.txt`);
        this.downloadLogs();
        this.downloadConfig();
        this.downloadData();

        // Offer to download frames
        if (this.frames.length > 0) {
            this.log('INFO', `Ready to download ${this.frames.length} frames. Call downloadAllFrames() if needed.`);
        }

        this.log('INFO', 'Debug package files downloaded');
    }

    /**
     * Helper to download blob
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * Clear all debug data
     */
    clear() {
        this.logs = [];
        this.frames = [];
        this.config = null;
        this.data = null;
        this.metadata = {};
        this.startTime = null;
        this.log('DEBUG', 'Debug data cleared');
    }

    /**
     * Get all logs
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Get all frames
     */
    getFrames() {
        return [...this.frames];
    }
}

// Export singleton instance
export const debugLogger = new DebugLogger();
