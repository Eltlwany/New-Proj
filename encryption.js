class EncryptionService {
    constructor() {
        this.key = null;
        this.iv = null;
    }

    async init() {
        // مفتاح التشفير - يمكن تغييره
        const keyStr = btoa('ton-app-secret-key-2024');
        const keyData = new TextEncoder().encode(keyStr.slice(0, 32));
        this.key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-CBC' },
            false,
            ['encrypt', 'decrypt']
        );
        
        this.iv = new Uint8Array(16);
        crypto.getRandomValues(this.iv);
    }

    async encrypt(data) {
        if (!this.key) await this.init();
        
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(JSON.stringify(data));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: this.iv },
            this.key,
            encodedData
        );
        
        return {
            iv: Array.from(this.iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    }

    async decrypt(encryptedData) {
        if (!this.key) await this.init();
        
        const iv = new Uint8Array(encryptedData.iv);
        const data = new Uint8Array(encryptedData.data);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: iv },
            this.key,
            data
        );
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }

    // تشفير البيانات الحساسة
    encryptSensitiveData(userData) {
        const sensitiveFields = ['balance', 'tub', 'totalEarned', 'referralEarnings'];
        const encryptedData = {...userData};
        
        sensitiveFields.forEach(field => {
            if (encryptedData[field] !== undefined) {
                encryptedData[field] = this.encryptValue(encryptedData[field]);
            }
        });
        
        return encryptedData;
    }

    encryptValue(value) {
        // تشفير بسيط للقيم الرقمية
        const salt = 123456;
        return btoa((Number(value) + salt).toString());
    }

    decryptValue(encryptedValue) {
        try {
            const salt = 123456;
            return Number(atob(encryptedValue)) - salt;
        } catch {
            return 0;
        }
    }
}

const encryptionService = new EncryptionService();
