/**
 * VideoCharts Web App
 * Main application entry point
 */

import { DataLoader } from './modules/DataLoader.js';
import { ChartRenderer } from './modules/ChartRenderer.js';
import { VideoRecorder } from './modules/VideoRecorder.js';
import { Animator } from './modules/Animator.js';
import { ConfigManager } from './modules/ConfigManager.js';
import { DebugLogger } from './modules/DebugLogger.js';

class VideoChartsApp {
    constructor() {
        // Initialize modules
        this.dataLoader = new DataLoader();
        this.configManager = new ConfigManager();
        this.debugLogger = new DebugLogger(false); // Start disabled
        this.chartRenderer = null;
        this.videoRecorder = null;
        this.animator = null;

        // State
        this.currentData = null;
        this.isGenerating = false;

        // DOM Elements
        this.elements = {
            // Drop zone
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput'),
            browseBtn: document.getElementById('browseBtn'),
            loadExampleBtn: document.getElementById('loadExampleBtn'),

            // Data info
            dataInfo: document.getElementById('dataInfo'),
            fileName: document.getElementById('fileName'),
            dataRows: document.getElementById('dataRows'),

            // Configuration inputs
            chartTitle: document.getElementById('chartTitle'),
            barColor: document.getElementById('barColor'),
            barColorHex: document.getElementById('barColorHex'),
            bgColor: document.getElementById('bgColor'),
            bgColorHex: document.getElementById('bgColorHex'),
            fontSize: document.getElementById('fontSize'),
            fontSizeValue: document.getElementById('fontSizeValue'),
            videoDuration: document.getElementById('videoDuration'),
            durationValue: document.getElementById('durationValue'),
            typewriterEffect: document.getElementById('typewriterEffect'),
            resolutionInputs: document.querySelectorAll('input[name="resolution"]'),

            // Steps
            stepData: document.getElementById('step-data'),
            stepConfig: document.getElementById('step-config'),
            stepGenerate: document.getElementById('step-generate'),

            // Preview
            previewContainer: document.getElementById('previewContainer'),
            previewCanvas: document.getElementById('previewCanvas'),
            refreshPreviewBtn: document.getElementById('refreshPreviewBtn'),

            // Generate
            generateBtn: document.getElementById('generateBtn'),
            progressContainer: document.getElementById('progressContainer'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),

            // Video result
            videoResult: document.getElementById('videoResult'),
            resultVideo: document.getElementById('resultVideo'),
            downloadBtn: document.getElementById('downloadBtn'),

            // Recording canvas
            recordingCanvas: document.getElementById('recordingCanvas'),

            // Error modal
            errorModal: document.getElementById('errorModal'),
            errorMessage: document.getElementById('errorMessage'),
            closeErrorBtn: document.getElementById('closeErrorBtn'),

            // Debug
            debugModeCheckbox: document.getElementById('debugModeCheckbox'),
            debugPanel: document.getElementById('debugPanel'),
            debugSessionId: document.getElementById('debugSessionId'),
            debugFramesCount: document.getElementById('debugFramesCount'),
            debugLogsCount: document.getElementById('debugLogsCount'),
            logsContainer: document.getElementById('logsContainer'),
            downloadLogsBtn: document.getElementById('downloadLogsBtn'),
            downloadConfigBtn: document.getElementById('downloadConfigBtn'),
            downloadDataBtn: document.getElementById('downloadDataBtn'),
            downloadFramesBtn: document.getElementById('downloadFramesBtn'),
            downloadDebugPackageBtn: document.getElementById('downloadDebugPackageBtn'),
            framesWarning: document.getElementById('framesWarning'),
            framesWarningCount: document.getElementById('framesWarningCount'),
            confirmDownloadFramesBtn: document.getElementById('confirmDownloadFramesBtn'),
            cancelDownloadFramesBtn: document.getElementById('cancelDownloadFramesBtn')
        };

        // Initialize
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        // Check browser compatibility
        if (!this.checkCompatibility()) {
            return;
        }

        // Setup event listeners
        this.setupEventListeners();

        console.log('VideoCharts Web initialized');
    }

    /**
     * Check browser compatibility
     */
    checkCompatibility() {
        const features = {
            mediaRecorder: VideoRecorder.isSupported(),
            canvas: !!document.createElement('canvas').getContext,
            fileReader: 'FileReader' in window
        };

        const missing = Object.entries(features)
            .filter(([_, supported]) => !supported)
            .map(([feature]) => feature);

        if (missing.length > 0) {
            this.showError(`Browser non supportato. Funzionalità mancanti: ${missing.join(', ')}`);
            return false;
        }

        return true;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File input
        this.elements.browseBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileLoad(file);
            }
        });

        // Drag and drop
        this.elements.dropZone.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('drag-over');
        });

        this.elements.dropZone.addEventListener('dragleave', () => {
            this.elements.dropZone.classList.remove('drag-over');
        });

        this.elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileLoad(file);
            }
        });

        // Load example
        this.elements.loadExampleBtn.addEventListener('click', () => {
            this.loadExampleData();
        });

        // Configuration inputs
        this.elements.chartTitle.addEventListener('input', (e) => {
            this.configManager.setValue('title', e.target.value);
            this.updatePreview();
        });

        // Color inputs with hex sync
        this.setupColorInput(this.elements.barColor, this.elements.barColorHex, 'barColor');
        this.setupColorInput(this.elements.bgColor, this.elements.bgColorHex, 'bgColor');

        // Font size
        this.elements.fontSize.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.fontSizeValue.textContent = `${value}px`;
            this.configManager.setValue('fontSize', value);
            this.updatePreview();
        });

        // Video duration
        this.elements.videoDuration.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.durationValue.textContent = `${value}s`;
            this.configManager.setValue('videoDuration', value);
        });

        // Resolution
        this.elements.resolutionInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.configManager.setValue('resolution', e.target.value);
            });
        });

        // Refresh preview
        this.elements.refreshPreviewBtn.addEventListener('click', () => {
            this.updatePreview();
        });

        // Generate video
        this.elements.generateBtn.addEventListener('click', () => {
            this.generateVideo();
        });

        // Download video
        this.elements.downloadBtn.addEventListener('click', () => {
            if (this.videoRecorder) {
                this.videoRecorder.download('chart-video');
            }
        });

        // Error modal
        this.elements.closeErrorBtn.addEventListener('click', () => {
            this.elements.errorModal.style.display = 'none';
        });

        // Debug mode toggle
        this.elements.debugModeCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.debugLogger.enable();
                this.debugLogger.log('SESSION', 'Debug mode enabled by user');
            } else {
                this.debugLogger.disable();
            }
        });

        // Debug download buttons
        this.elements.downloadLogsBtn.addEventListener('click', () => {
            this.debugLogger.downloadLogs();
        });

        this.elements.downloadConfigBtn.addEventListener('click', () => {
            this.debugLogger.downloadConfig();
        });

        this.elements.downloadDataBtn.addEventListener('click', () => {
            this.debugLogger.downloadData();
        });

        this.elements.downloadFramesBtn.addEventListener('click', () => {
            this.showFramesWarning();
        });

        this.elements.confirmDownloadFramesBtn.addEventListener('click', () => {
            this.elements.framesWarning.style.display = 'none';
            this.debugLogger.downloadAllFrames();
        });

        this.elements.cancelDownloadFramesBtn.addEventListener('click', () => {
            this.elements.framesWarning.style.display = 'none';
        });

        this.elements.downloadDebugPackageBtn.addEventListener('click', () => {
            this.debugLogger.downloadDebugPackage();
        });
    }

    /**
     * Setup color input with hex synchronization
     */
    setupColorInput(colorInput, hexInput, configKey) {
        colorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            hexInput.value = color.toUpperCase();
            this.configManager.setValue(configKey, color);
            this.updatePreview();
        });

        hexInput.addEventListener('input', (e) => {
            let hex = e.target.value;
            if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
                colorInput.value = hex;
                this.configManager.setValue(configKey, hex);
                this.updatePreview();
            }
        });
    }

    /**
     * Handle file load
     */
    async handleFileLoad(file) {
        try {
            if (this.debugLogger.isEnabled()) {
                this.debugLogger.log('INFO', 'Loading file', { filename: file.name, size: file.size });
            }
            const data = await this.dataLoader.loadFromFile(file);
            this.onDataLoaded(data);
        } catch (error) {
            if (this.debugLogger.isEnabled()) {
                this.debugLogger.log('ERROR', 'Failed to load file', { error: error.message });
            }
            this.showError(error.message);
        }
    }

    /**
     * Load example data
     */
    async loadExampleData() {
        try {
            const data = await this.dataLoader.loadExample();
            this.onDataLoaded(data);
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Handle data loaded
     */
    onDataLoaded(data) {
        this.currentData = data;

        // Update UI
        const stats = this.dataLoader.getStats();
        this.elements.fileName.textContent = this.dataLoader.getFileName();
        this.elements.dataRows.textContent = stats.rowCount;
        this.elements.dataInfo.style.display = 'block';

        // Show configuration and generate steps
        this.elements.stepConfig.style.display = 'block';
        this.elements.stepGenerate.style.display = 'block';
        this.elements.refreshPreviewBtn.style.display = 'inline-flex';

        // Render preview
        this.renderPreview();
    }

    /**
     * Render preview
     */
    renderPreview() {
        if (!this.currentData) return;

        // Hide placeholder, show canvas
        this.elements.previewContainer.querySelector('.preview-placeholder').style.display = 'none';
        this.elements.previewCanvas.style.display = 'block';

        // Setup preview canvas (smaller size for preview)
        const previewWidth = 800;
        const previewHeight = 450; // 16:9 aspect ratio
        this.elements.previewCanvas.width = previewWidth;
        this.elements.previewCanvas.height = previewHeight;

        // Create chart renderer
        if (this.chartRenderer) {
            this.chartRenderer.destroy();
        }

        this.chartRenderer = new ChartRenderer(
            this.elements.previewCanvas,
            this.configManager.get()
        );

        // Render chart
        this.chartRenderer.renderHorizontalBarChart(this.currentData);
    }

    /**
     * Update preview with current config
     */
    updatePreview() {
        if (!this.currentData) return;

        // Update renderer config
        if (this.chartRenderer) {
            this.chartRenderer.updateConfig(this.configManager.get());
            this.chartRenderer.destroy();
            this.chartRenderer.renderHorizontalBarChart(this.currentData);
        }
    }

    /**
     * Generate video
     */
    async generateVideo() {
        if (this.isGenerating || !this.currentData) {
            return;
        }

        this.isGenerating = true;
        this.elements.generateBtn.disabled = true;
        this.elements.progressContainer.style.display = 'block';
        this.elements.videoResult.style.display = 'none';

        // Start debug session if enabled
        if (this.debugLogger.isEnabled()) {
            this.debugLogger.startSession();
            this.debugLogger.saveConfig(this.configManager.get());
            this.debugLogger.saveData(this.currentData);
            this.debugLogger.log('INFO', 'Video generation started');

            // Show debug panel
            this.elements.debugPanel.style.display = 'block';
            this.updateDebugUI();

            // Start live log updates
            this.startLiveLogUpdates();
        }

        try {
            // Get resolution
            const resolution = this.configManager.getResolution(
                this.configManager.getValue('resolution')
            );

            // Setup recording canvas
            this.elements.recordingCanvas.width = resolution.width;
            this.elements.recordingCanvas.height = resolution.height;

            // Create chart renderer for recording
            const recordingRenderer = new ChartRenderer(
                this.elements.recordingCanvas,
                this.configManager.get()
            );
            recordingRenderer.renderHorizontalBarChart(this.currentData);

            // Create animator
            const duration = this.configManager.getValue('videoDuration');
            const useTypewriter = this.elements.typewriterEffect.checked;
            this.animator = new Animator(recordingRenderer, duration, this.debugLogger, useTypewriter);

            // Create video recorder
            this.videoRecorder = new VideoRecorder(this.elements.recordingCanvas, {
                fps: this.configManager.getValue('fps')
            });

            // Update progress
            this.updateProgress(0, 'Inizializzazione recording...');

            // Start recording
            await this.videoRecorder.start();

            this.updateProgress(10, 'Recording in corso...');

            // Create and play animation timeline
            const timeline = this.animator.createHorizontalBarChartTimeline(
                (progress) => {
                    // Update progress (10% to 90%)
                    this.updateProgress(10 + (progress * 0.8), 'Rendering animazione...');
                },
                async () => {
                    // Animation complete
                    this.updateProgress(90, 'Finalizzazione video...');

                    if (this.debugLogger.isEnabled()) {
                        this.debugLogger.log('ANIMATION', 'Animation complete, stopping recorder');
                    }

                    // Stop recording
                    await this.videoRecorder.stop();

                    this.updateProgress(100, 'Completato!');

                    if (this.debugLogger.isEnabled()) {
                        this.debugLogger.log('INFO', 'Video generation complete');
                        this.debugLogger.addMetadata('videoSize', this.videoRecorder.getVideoBlob().size);
                        this.stopLiveLogUpdates();

                        // Final update
                        this.updateDebugUI();
                        this.updateLiveLogs();
                    }

                    // Show result
                    this.showVideoResult();

                    // Cleanup
                    recordingRenderer.destroy();
                    this.animator.destroy();

                    this.isGenerating = false;
                    this.elements.generateBtn.disabled = false;
                }
            );

            // Play timeline
            timeline.play();

        } catch (error) {
            console.error('Error generating video:', error);

            if (this.debugLogger.isEnabled()) {
                this.debugLogger.log('ERROR', 'Video generation failed', { error: error.message, stack: error.stack });
                this.stopLiveLogUpdates();
                this.updateDebugUI();
                this.updateLiveLogs();
            }

            this.showError(`Errore nella generazione del video: ${error.message}`);
            this.isGenerating = false;
            this.elements.generateBtn.disabled = false;
            this.elements.progressContainer.style.display = 'none';
        }
    }

    /**
     * Update progress
     */
    updateProgress(percent, text) {
        this.elements.progressFill.style.width = `${percent}%`;
        this.elements.progressPercent.textContent = `${Math.round(percent)}%`;
        this.elements.progressText.textContent = text;
    }

    /**
     * Show video result
     */
    showVideoResult() {
        const videoURL = this.videoRecorder.getVideoURL();

        this.elements.resultVideo.src = videoURL;
        this.elements.videoResult.style.display = 'block';
        this.elements.progressContainer.style.display = 'none';
    }

    /**
     * Show error
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorModal.style.display = 'flex';
    }

    /**
     * Update debug UI
     */
    updateDebugUI() {
        if (!this.debugLogger.isEnabled()) return;

        const summary = this.debugLogger.getSummary();

        this.elements.debugSessionId.textContent = summary.sessionId;
        this.elements.debugFramesCount.textContent = summary.totalFrames;
        this.elements.debugLogsCount.textContent = summary.totalLogs;
    }

    /**
     * Start live log updates
     */
    startLiveLogUpdates() {
        // Update UI every 100ms
        this.logUpdateInterval = setInterval(() => {
            this.updateLiveLogs();
            this.updateDebugUI();
        }, 100);
    }

    /**
     * Stop live log updates
     */
    stopLiveLogUpdates() {
        if (this.logUpdateInterval) {
            clearInterval(this.logUpdateInterval);
            this.logUpdateInterval = null;
        }
    }

    /**
     * Update live logs display
     */
    updateLiveLogs() {
        if (!this.debugLogger.isEnabled()) return;

        const logs = this.debugLogger.getLogs();
        const container = this.elements.logsContainer;

        // Only show last 50 logs to avoid performance issues
        const recentLogs = logs.slice(-50);

        container.innerHTML = recentLogs.map(log => {
            const dataStr = log.data ? ` - ${JSON.stringify(log.data)}` : '';
            return `<div class="log-entry">
                <span class="log-timestamp">[${log.elapsed}]</span>
                <span class="log-level log-level-${log.level}">[${log.level}]</span>
                <span class="log-message">${log.message}${dataStr}</span>
            </div>`;
        }).join('');

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Show frames download warning
     */
    showFramesWarning() {
        const frameCount = this.debugLogger.getFrames().length;

        if (frameCount === 0) {
            alert('Nessun frame catturato. Assicurati che il debug mode sia attivo durante la generazione.');
            return;
        }

        this.elements.framesWarningCount.textContent = frameCount;
        this.elements.framesWarning.style.display = 'block';
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new VideoChartsApp();
    });
} else {
    window.app = new VideoChartsApp();
}
