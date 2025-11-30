/**
 * ConfigManager Module
 * Manages user configuration and settings
 */

export class ConfigManager {
    constructor() {
        this.config = this.getDefaultConfig();
    }

    /**
     * Get default configuration
     * @returns {Object} Default config
     */
    getDefaultConfig() {
        return {
            title: 'GDP BY COUNTRY (IN $)',
            barColor: '#000000',
            bgColor: '#FFFFFF',
            fontSize: 24,
            fontFamily: 'xkcd Script',
            videoDuration: 5,
            resolution: '1080p',
            fps: 30
        };
    }

    /**
     * Get resolution dimensions
     * @param {string} resolution - Resolution string (480p, 720p, 1080p)
     * @returns {Object} {width, height}
     */
    getResolution(resolution) {
        const resolutions = {
            '480p': { width: 854, height: 480 },
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 }
        };

        return resolutions[resolution] || resolutions['1080p'];
    }

    /**
     * Update configuration
     * @param {Object} updates - Config updates
     */
    update(updates) {
        this.config = {
            ...this.config,
            ...updates
        };
    }

    /**
     * Get current configuration
     * @returns {Object} Current config
     */
    get() {
        return { ...this.config };
    }

    /**
     * Get specific config value
     * @param {string} key - Config key
     * @returns {*} Config value
     */
    getValue(key) {
        return this.config[key];
    }

    /**
     * Set specific config value
     * @param {string} key - Config key
     * @param {*} value - Config value
     */
    setValue(key, value) {
        this.config[key] = value;
    }

    /**
     * Reset to default configuration
     */
    reset() {
        this.config = this.getDefaultConfig();
    }

    /**
     * Export configuration as JSON
     * @returns {string} JSON string
     */
    exportJSON() {
        return JSON.stringify(this.config, null, 2);
    }

    /**
     * Import configuration from JSON
     * @param {string} json - JSON string
     */
    importJSON(json) {
        try {
            const imported = JSON.parse(json);
            this.config = {
                ...this.getDefaultConfig(),
                ...imported
            };
        } catch (error) {
            throw new Error('Invalid JSON configuration');
        }
    }
}
