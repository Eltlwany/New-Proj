class Utils {
    static formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    static formatCurrency(amount, currency = 'TON') {
        return `${this.formatNumber(amount)} ${currency}`;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static validateWalletAddress(address) {
        return /^[a-zA-Z0-9]{48}$/.test(address);
    }

    static getCurrentDate() {
        return new Date().toISOString().slice(0, 10);
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
