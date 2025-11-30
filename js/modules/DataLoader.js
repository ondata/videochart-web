/**
 * DataLoader Module
 * Handles loading and parsing data from JSON files
 */

export class DataLoader {
    constructor() {
        this.data = null;
        this.fileName = null;
    }

    /**
     * Load data from a File object
     * @param {File} file - The file to load
     * @returns {Promise<Object>} Parsed data
     */
    async loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const data = JSON.parse(content);

                    // Validate data structure
                    this.validateData(data);

                    this.data = data;
                    this.fileName = file.name;

                    resolve(data);
                } catch (error) {
                    reject(new Error(`Errore nel parsing del file: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Errore nella lettura del file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Load data from a URL
     * @param {string} url - URL to fetch data from
     * @returns {Promise<Object>} Parsed data
     */
    async loadFromURL(url) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Validate data structure
            this.validateData(data);

            this.data = data;
            this.fileName = url.split('/').pop();

            return data;
        } catch (error) {
            throw new Error(`Errore nel caricamento dei dati: ${error.message}`);
        }
    }

    /**
     * Load example data (from local file)
     * @returns {Promise<Object>} Example data
     */
    async loadExample() {
        return this.loadFromURL('assets/examples/video-data.json');
    }

    /**
     * Validate data structure
     * @param {Object} data - Data to validate
     * @throws {Error} If data is invalid
     */
    validateData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Il file deve contenere un oggetto JSON valido');
        }

        // Check for required fields based on chart type
        // For now, we support the horizontal bar chart format
        if (!data.countries || !Array.isArray(data.countries)) {
            throw new Error('Il campo "countries" è obbligatorio e deve essere un array');
        }

        if (!data.gdp || !Array.isArray(data.gdp)) {
            throw new Error('Il campo "gdp" è obbligatorio e deve essere un array');
        }

        if (data.countries.length !== data.gdp.length) {
            throw new Error('Gli array "countries" e "gdp" devono avere la stessa lunghezza');
        }

        if (data.countries.length === 0) {
            throw new Error('I dati devono contenere almeno un elemento');
        }

        // Validate GDP values are numbers
        const invalidValues = data.gdp.filter(val => typeof val !== 'number' || isNaN(val));
        if (invalidValues.length > 0) {
            throw new Error('Tutti i valori di "gdp" devono essere numeri validi');
        }
    }

    /**
     * Get current data
     * @returns {Object|null} Current data or null if no data loaded
     */
    getData() {
        return this.data;
    }

    /**
     * Get file name
     * @returns {string|null} File name or null
     */
    getFileName() {
        return this.fileName;
    }

    /**
     * Get data statistics
     * @returns {Object} Statistics about the data
     */
    getStats() {
        if (!this.data) {
            return null;
        }

        return {
            rowCount: this.data.countries.length,
            maxValue: Math.max(...this.data.gdp),
            minValue: Math.min(...this.data.gdp),
            avgValue: this.data.gdp.reduce((a, b) => a + b, 0) / this.data.gdp.length
        };
    }

    /**
     * Clear loaded data
     */
    clear() {
        this.data = null;
        this.fileName = null;
    }
}
