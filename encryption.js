class EncryptionService {
    constructor() {
        this.encryptionKey = 'ton-app-secure-key-2024';
    }

    // تشفير البيانات الحساسة
    encryptSensitiveData(data) {
        const sensitiveFields = ['balance', 'tub', 'totalEarned', 'referralEarnings', 'lifetimeAdCount'];
        const encrypted = {...data};
        
        sensitiveFields.forEach(field => {
            if (encrypted[field] !== undefined) {
                encrypted[field] = this.encryptValue(encrypted[field]);
            }
        });
        
        return encrypted;
    }

    // فك تشفير البيانات
    decryptSensitiveData(encryptedData) {
        const sensitiveFields = ['balance', 'tub', 'totalEarned', 'referralEarnings', 'lifetimeAdCount'];
        const decrypted = {...encryptedData};
        
        sensitiveFields.forEach(field => {
            if (decrypted[field] !== undefined && typeof decrypted[field] === 'string') {
                decrypted[field] = this.decryptValue(decrypted[field]);
            }
        });
        
        return decrypted;
    }

    encryptValue(value) {
        try {
            const salt = 123456789;
            const encrypted = btoa((Number(value) + salt).toString());
            return `enc_${encrypted}`;
        } catch {
            return value;
        }
    }

    decryptValue(encryptedValue) {
        try {
            if (!encryptedValue.startsWith('enc_')) return Number(encryptedValue);
            
            const salt = 123456789;
            const value = encryptedValue.replace('enc_', '');
            return Number(atob(value)) - salt;
        } catch {
            return 0;
        }
    }

    // تشفير كامل للكائن
    encryptObject(obj) {
        const encrypted = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'number') {
                encrypted[key] = this.encryptValue(value);
            } else {
                encrypted[key] = value;
            }
        }
        return encrypted;
    }

    // فك تشفير كامل للكائن
    decryptObject(encryptedObj) {
        const decrypted = {};
        for (const [key, value] of Object.entries(encryptedObj)) {
            if (typeof value === 'string' && value.startsWith('enc_')) {
                decrypted[key] = this.decryptValue(value);
            } else {
                decrypted[key] = value;
            }
        }
        return decrypted;
    }
}

const encryptionService = new EncryptionService();
