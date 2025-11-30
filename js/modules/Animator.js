/**
 * Animator Module
 * Handles animation timeline using GSAP
 */

export class Animator {
    constructor(chartRenderer, duration = 5, debugLogger = null, useTypewriter = false) {
        this.chartRenderer = chartRenderer;
        this.duration = duration;
        this.timeline = null;
        this.canvas = chartRenderer.canvas;
        this.ctx = chartRenderer.ctx;
        this.chart = chartRenderer.chart;
        this.debugLogger = debugLogger;
        this.frameCounter = 0;
        this.captureInterval = null;
        this.useTypewriter = useTypewriter;
    }

    /**
     * Create and return animation timeline for horizontal bar chart
     * @param {Function} onProgress - Progress callback (percent: 0-100)
     * @param {Function} onComplete - Completion callback
     * @returns {gsap.core.Timeline} GSAP timeline
     */
    createHorizontalBarChartTimeline(onProgress = null, onComplete = null) {
        // Kill existing timeline if any
        if (this.timeline) {
            this.timeline.kill();
        }

        if (this.debugLogger?.isEnabled()) {
            this.debugLogger.log('ANIMATION', 'Creating timeline', {
                duration: this.duration,
                canvasSize: `${this.canvas.width}x${this.canvas.height}`
            });
        }

        // Reset frame counter
        this.frameCounter = 0;

        // Create new timeline
        this.timeline = gsap.timeline({
            onUpdate: () => {
                if (onProgress) {
                    const progress = (this.timeline.progress() * 100);
                    onProgress(progress);
                }

                // Capture frames at regular intervals (1 every 10 frames to reduce debug data)
                if (this.debugLogger?.isEnabled()) {
                    const currentTime = this.timeline.time();
                    const fps = 30; // Target FPS
                    const frameInterval = 1 / fps;
                    const expectedFrame = Math.floor(currentTime / frameInterval);

                    if (expectedFrame > this.frameCounter) {
                        this.frameCounter = expectedFrame;

                        // Capture only 1 frame every 10 (to reduce debug output size)
                        const captureEvery = 10;
                        if (this.frameCounter === 1 || this.frameCounter % captureEvery === 0) {
                            this.captureCurrentFrame(`frame-${this.frameCounter}`, this.frameCounter);
                        }
                    }
                }
            },
            onComplete: () => {
                if (this.debugLogger?.isEnabled()) {
                    this.debugLogger.log('ANIMATION', 'Timeline completed', {
                        totalFrames: this.frameCounter,
                        duration: this.duration
                    });
                }

                if (onComplete) {
                    onComplete();
                }
            }
        });

        const chart = this.chartRenderer.getChart();
        if (!chart) {
            throw new Error('No chart available to animate');
        }

        const meta = chart.getDatasetMeta(0);
        const bars = meta.data;

        if (this.debugLogger?.isEnabled()) {
            this.debugLogger.log('ANIMATION', 'Chart metadata loaded', {
                barsCount: bars.length,
                dataPoints: chart.data.datasets[0].data
            });
        }

        // Get configuration
        const titleDuration = this.duration * 0.2; // 20% for title
        const barsDuration = this.duration * 0.4; // 40% for bars
        const labelsDuration = this.duration * 0.2; // 20% for labels
        const holdDuration = this.duration * 0.2; // 20% hold at end

        // Animation sequence:
        // 1. Fade in title (0 - 20%)
        // 2. Grow bars with stagger (20% - 60%)
        // 3. Fade in value labels (60% - 80%)
        // 4. Hold final state (80% - 100%)

        // Initial state: hide everything
        const titleText = this.chartRenderer.config.title.toUpperCase();
        const titleElement = this.useTypewriter ?
            { charsVisible: 0 } :
            { opacity: 0 };
        const barsState = bars.map(() => ({ scaleX: 0 }));
        const labelsState = { opacity: 0 };

        // 1. Animate title (typewriter or fade in)
        if (this.useTypewriter) {
            // Typewriter effect - reveal characters one by one
            this.timeline.to(titleElement, {
                charsVisible: titleText.length,
                duration: titleDuration,
                ease: 'none', // Linear for typewriter
                onUpdate: () => {
                    this.redrawChart(titleElement, barsState, labelsState);
                }
            });
        } else {
            // Fade in effect
            this.timeline.to(titleElement, {
                opacity: 1,
                duration: titleDuration,
                ease: 'power2.out',
                onUpdate: () => {
                    this.redrawChart(titleElement, barsState, labelsState);
                }
            });
        }

        // 2. Animate bars (staggered)
        bars.forEach((bar, index) => {
            const delay = (index * 0.15); // Stagger delay

            this.timeline.to(barsState[index], {
                scaleX: 1,
                duration: barsDuration / bars.length,
                ease: 'power3.out',
                onUpdate: () => {
                    this.redrawChart(titleElement.opacity, barsState, labelsState);
                }
            }, titleDuration + delay);
        });

        // 3. Fade in labels
        this.timeline.to(labelsState, {
            opacity: 1,
            duration: labelsDuration,
            ease: 'power2.out',
            onUpdate: () => {
                this.redrawChart(titleElement.opacity, barsState, labelsState);
            }
        }, titleDuration + barsDuration);

        // 4. Hold final state
        this.timeline.to({}, {
            duration: holdDuration
        });

        return this.timeline;
    }

    /**
     * Redraw chart with animation states
     * @param {Object} titleElement - Title state {opacity: 0-1} or {charsVisible: number}
     * @param {Array} barsState - Array of bar states {scaleX: 0-1}
     * @param {Object} labelsState - Labels state {opacity: 0-1}
     */
    redrawChart(titleElement, barsState, labelsState) {
        const chart = this.chartRenderer.getChart();
        const data = chart.data.datasets[0].data;
        const labels = chart.data.labels;
        const meta = chart.getDatasetMeta(0);
        const bars = meta.data;

        // Clear canvas with background color
        this.ctx.fillStyle = this.chartRenderer.config.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw title (typewriter or fade in)
        this.ctx.save();
        this.ctx.font = `${Math.floor(this.chartRenderer.config.fontSize * 1.5)}px "${this.chartRenderer.config.fontFamily}"`;
        this.ctx.fillStyle = this.chartRenderer.config.barColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        const fullTitle = this.chartRenderer.config.title.toUpperCase();
        let displayTitle;

        if (this.useTypewriter && titleElement.charsVisible !== undefined) {
            // Typewriter: show only first N characters
            const chars = Math.floor(titleElement.charsVisible);
            displayTitle = fullTitle.substring(0, chars);
        } else {
            // Fade in: show full title with opacity
            this.ctx.globalAlpha = titleElement.opacity || 0;
            displayTitle = fullTitle;
        }

        this.ctx.fillText(
            displayTitle,
            this.canvas.width / 2,
            30
        );
        this.ctx.restore();

        // Draw bars and labels
        bars.forEach((bar, index) => {
            const scaleX = barsState[index].scaleX;

            // Use bar.base as starting position and calculate width from base to x
            const barX = bar.base;
            const barWidth = (bar.x - bar.base) * scaleX;
            const barHeight = bar.height;
            const barY = bar.y - barHeight / 2;

            // Draw bar
            this.ctx.fillStyle = this.chartRenderer.config.barColor;
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Draw country label (y-axis) - positioned before the bar
            this.ctx.save();
            this.ctx.font = `${Math.floor(this.chartRenderer.config.fontSize * 1.1)}px "${this.chartRenderer.config.fontFamily}"`;
            this.ctx.fillStyle = this.chartRenderer.config.barColor;
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(labels[index], barX - 20, bar.y);
            this.ctx.restore();

            // Draw value label with opacity - positioned after the bar
            this.ctx.save();
            this.ctx.globalAlpha = labelsState.opacity;
            this.ctx.font = `${this.chartRenderer.config.fontSize}px "${this.chartRenderer.config.fontFamily}"`;
            this.ctx.fillStyle = this.chartRenderer.config.barColor;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            const value = data[index];
            const valueLabel = `$${value.toLocaleString()}`.toUpperCase();
            this.ctx.fillText(valueLabel, barX + barWidth + 10, bar.y);
            this.ctx.restore();
        });
    }

    /**
     * Play timeline
     */
    play() {
        if (this.timeline) {
            this.timeline.play();
        }
    }

    /**
     * Pause timeline
     */
    pause() {
        if (this.timeline) {
            this.timeline.pause();
        }
    }

    /**
     * Get timeline duration
     * @returns {number} Duration in seconds
     */
    getDuration() {
        return this.duration;
    }

    /**
     * Update duration
     * @param {number} duration - New duration in seconds
     */
    setDuration(duration) {
        this.duration = duration;
    }

    /**
     * Capture current frame
     * @param {string} name - Frame name
     * @param {number} number - Frame number
     */
    async captureCurrentFrame(name, number) {
        if (this.debugLogger?.isEnabled()) {
            await this.debugLogger.captureFrame(this.canvas, name, number);
        }
    }

    /**
     * Kill timeline and cleanup
     */
    destroy() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }

        if (this.debugLogger?.isEnabled()) {
            this.debugLogger.log('ANIMATION', 'Animator destroyed');
        }
    }
}
