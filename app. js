class TonApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.db = null;
        this.userState = {};
        this.appConfig = {};
        this.isInitialized = false;
    }

    async init() {
        try {
            // تهيئة التشفير أولاً
            await encryptionService.init();
            
            // تهيئة Firebase
            await this.initFirebase();
            
            // تحميل التكوين
            await this.loadConfig();
            
            // تحميل بيانات المستخدم
            await this.loadUserData();
            
            // تهيئة الواجهة
            this.initUI();
            
            this.isInitialized = true;
            console.log('✅ App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize app');
        }
    }

    async initFirebase() {
        try {
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            
            // اختبار الاتصال
            await this.db.ref('.info/connected').once('value');
            console.log('✅ Firebase connected');
            
        } catch (error) {
            console.error('❌ Firebase connection failed:', error);
            throw new Error('Firebase initialization failed');
        }
    }

    async loadConfig() {
        try {
            const configSnapshot = await this.db.ref('config').once('value');
            const rawConfig = configSnapshot.val() || {};
            
            // تشفير التكوين الحساس
            this.appConfig = encryptionService.encryptSensitiveData(rawConfig);
            
        } catch (error) {
            console.error('❌ Config loading failed:', error);
            this.appConfig = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            adValue: 100,
            dailyAdLimit: 10,
            adsPerBreak: 5,
            breakDuration: 5,
            minimumWithdrawReferrals: 0
        };
    }

    async loadUserData() {
        if (!this.tg?.initDataUnsafe?.user?.id) {
            throw new Error('User not authenticated');
        }

        const userId = this.tg.initDataUnsafe.user.id;
        const userRef = this.db.ref(`users/${userId}`);
        
        const snapshot = await userRef.once('value');
        let userData = snapshot.val();

        if (!userData) {
            userData = await this.createNewUser(userId);
        }

        // تشفير البيانات الحساسة
        this.userState = encryptionService.encryptSensitiveData(userData);
    }

    // ... باقي الدوال الرئيسية
}

const app = new TonApp();
