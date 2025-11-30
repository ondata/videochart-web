/**
 * VideoRecorder Module
 * Handles canvas recording and video generation using MediaRecorder API
 */

export class VideoRecorder {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            fps: 30,
            videoBitsPerSecond: 5000000, // 5 Mbps
            ...options
        };

        this.mediaRecorder = null;
        this.chunks = [];
        this.stream = null;
        this.isRecording = false;
        this.videoBlob = null;

        // Detect best supported MIME type
        this.mimeType = this.detectMimeType();
    }

    /**
     * Detect the best supported MIME type for video recording
     * @returns {string} Supported MIME type
     */
    detectMimeType() {
        const types = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log(`Using MIME type: ${type}`);
                return type;
            }
        }

        // Fallback
        console.warn('No preferred MIME type supported, using default');
        return '';
    }

    /**
     * Start recording
     * @returns {Promise<void>}
     */
    async start() {
        if (this.isRecording) {
            throw new Error('Recording already in progress');
        }

        // Clear previous recording
        this.chunks = [];
        this.videoBlob = null;

        // Capture stream from canvas
        this.stream = this.canvas.captureStream(this.options.fps);

        // Create MediaRecorder
        const recorderOptions = {
            mimeType: this.mimeType,
            videoBitsPerSecond: this.options.videoBitsPerSecond
        };

        this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);

        // Handle data available event
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                this.chunks.push(event.data);
            }
        };

        // Start recording
        this.mediaRecorder.start(100); // Collect data every 100ms
        this.isRecording = true;

        console.log('Recording started');
    }

    /**
     * Stop recording and get video blob
     * @returns {Promise<Blob>} Video blob
     */
    async stop() {
        if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('No recording in progress');
        }

        return new Promise((resolve, reject) => {
            this.mediaRecorder.onstop = () => {
                // Create blob from chunks
                this.videoBlob = new Blob(this.chunks, {
                    type: this.mimeType || 'video/webm'
                });

                this.isRecording = false;
                console.log(`Recording stopped. Blob size: ${(this.videoBlob.size / 1024 / 1024).toFixed(2)} MB`);

                // Stop all tracks
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }

                resolve(this.videoBlob);
            };

            this.mediaRecorder.onerror = (error) => {
                this.isRecording = false;
                reject(error);
            };

            // Stop the recorder
            this.mediaRecorder.stop();
        });
    }

    /**
     * Get the recorded video blob
     * @returns {Blob|null} Video blob or null if not recorded
     */
    getVideoBlob() {
        return this.videoBlob;
    }

    /**
     * Get video URL for preview
     * @returns {string|null} Object URL or null
     */
    getVideoURL() {
        if (!this.videoBlob) {
            return null;
        }
        return URL.createObjectURL(this.videoBlob);
    }

    /**
     * Download the recorded video
     * @param {string} filename - Output filename
     */
    download(filename = 'chart-video') {
        if (!this.videoBlob) {
            throw new Error('No video to download');
        }

        // Determine file extension from MIME type
        let extension = 'webm';
        if (this.mimeType.includes('mp4')) {
            extension = 'mp4';
        }

        const fullFilename = filename.endsWith(`.${extension}`)
            ? filename
            : `${filename}.${extension}`;

        // Create download link
        const url = URL.createObjectURL(this.videoBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fullFilename;

        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        console.log(`Downloaded: ${fullFilename}`);
    }

    /**
     * Check if MediaRecorder is supported
     * @returns {boolean} True if supported
     */
    static isSupported() {
        return 'MediaRecorder' in window;
    }

    /**
     * Get recording status
     * @returns {boolean} True if recording
     */
    isRecordingActive() {
        return this.isRecording;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        this.chunks = [];
        this.mediaRecorder = null;
        this.stream = null;
        this.isRecording = false;

        if (this.videoBlob) {
            // Don't clear videoBlob as it might still be needed
            // URL.revokeObjectURL should be called by the consumer
        }
    }
}
