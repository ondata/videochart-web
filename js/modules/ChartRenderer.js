/**
 * ChartRenderer Module
 * Renders charts using Chart.js
 */

export class ChartRenderer {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.chart = null;
        this.config = {
            title: 'GDP BY COUNTRY (IN $)',
            barColor: '#000000',
            bgColor: '#FFFFFF',
            fontSize: 24,
            fontFamily: 'xkcd Script',
            ...config
        };
    }

    /**
     * Render a horizontal bar chart
     * @param {Object} data - Chart data {countries: [], gdp: []}
     */
    renderHorizontalBarChart(data) {
        // Destroy existing chart if any
        if (this.chart) {
            this.chart.destroy();
        }

        // Set canvas background
        this.setCanvasBackground();

        // Prepare data for Chart.js
        const chartData = {
            labels: data.countries.map(c => c.toUpperCase()),
            datasets: [{
                label: 'GDP',
                data: data.gdp,
                backgroundColor: this.config.barColor,
                borderWidth: 0,
                borderSkipped: false
            }]
        };

        // Chart configuration
        const chartConfig = {
            type: 'bar',
            data: chartData,
            options: {
                indexAxis: 'y', // Horizontal bars
                responsive: false,
                animation: false, // We'll animate with GSAP
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 20,
                        right: 100,
                        top: 80,
                        bottom: 20
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: this.config.fontFamily,
                                size: Math.floor(this.config.fontSize * 1.1),
                                weight: 'normal'
                            },
                            color: this.config.barColor,
                            padding: 10
                        },
                        border: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: this.config.title.toUpperCase(),
                        font: {
                            family: this.config.fontFamily,
                            size: Math.floor(this.config.fontSize * 1.5),
                            weight: 'normal'
                        },
                        color: this.config.barColor,
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    },
                    tooltip: {
                        enabled: false
                    },
                    // Custom plugin to draw value labels
                    datalabels: false
                }
            },
            plugins: [{
                id: 'customLabels',
                afterDatasetsDraw: (chart) => {
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);

                    ctx.save();
                    ctx.font = `${this.config.fontSize}px "${this.config.fontFamily}"`;
                    ctx.fillStyle = this.config.barColor;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';

                    meta.data.forEach((bar, index) => {
                        const value = data.gdp[index];
                        const label = `$${value.toLocaleString()}`;
                        const x = bar.x + bar.width + 10;
                        const y = bar.y;

                        ctx.fillText(label.toUpperCase(), x, y);
                    });

                    ctx.restore();
                }
            }]
        };

        // Create chart
        this.chart = new Chart(this.ctx, chartConfig);

        return this.chart;
    }

    /**
     * Set canvas background color
     */
    setCanvasBackground() {
        this.ctx.fillStyle = this.config.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Update chart configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }

    /**
     * Get chart instance
     * @returns {Chart|null} Chart.js instance
     */
    getChart() {
        return this.chart;
    }

    /**
     * Get animatable elements for GSAP
     * @returns {Object} Elements that can be animated
     */
    getAnimatableElements() {
        if (!this.chart) {
            return null;
        }

        const meta = this.chart.getDatasetMeta(0);

        return {
            bars: meta.data,
            title: this.chart.options.plugins.title,
            chart: this.chart
        };
    }

    /**
     * Destroy chart and cleanup
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Resize canvas
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}
