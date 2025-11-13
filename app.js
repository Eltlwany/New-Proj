class TonApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.db = null;
        this.userState = {};
        this.appConfig = {};
        this.isInitialized = false;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log('🚀 Initializing Ton App...');
            
            // تهيئة Telegram Web App
            this.tg.ready();
            this.tg.expand();
            document.body.className = `${this.tg.colorScheme}-theme`;
            
            // التحقق من بيانات المستخدم
            this.tgUser = this.tg.initDataUnsafe.user;
            if (!this.tgUser?.id) {
                throw new Error('User authentication failed');
            }

            // التحقق من الحسابات المتعددة
            const allowed = await this.checkMultiAccount();
            if (!allowed) return;

            // تهيئة Firebase
            await this.initFirebase();
            
            // تحميل التكوين
            await this.loadAppConfig();
            
            // تحميل بيانات المستخدم
            await this.loadUserData();
            
            // تهيئة الواجهة
            this.initUI();
            
            // إخفاء شاشة التحميل
            this.hideLoader();
            
            this.isInitialized = true;
            console.log('✅ Ton App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize application');
        }
    }

    async checkMultiAccount() {
        // كود التحقق من الحسابات المتعددة
        const ip = await this.getUserIP();
        if (!ip) return true;

        const ipData = JSON.parse(localStorage.getItem("ip_records")) || {};
        
        if (ipData[ip] && ipData[ip] !== this.tgUser.id) {
            this.showMultiAccountError();
            return false;
        }

        if (!ipData[ip]) {
            ipData[ip] = this.tgUser.id;
            localStorage.setItem("ip_records", JSON.stringify(ipData));
        }
        
        return true;
    }

    async initFirebase() {
        try {
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            
            // اختبار الاتصال
            await this.db.ref('.info/connected').once('value');
            console.log('✅ Firebase connected successfully');
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw new Error('Database connection failed');
        }
    }

    async loadAppConfig() {
        try {
            const configSnapshot = await this.db.ref('config').once('value');
            const rawConfig = configSnapshot.val() || {};
            
            // تشفير البيانات الحساسة في التكوين
            this.appConfig = encryptionService.encryptSensitiveData(rawConfig);
            
            console.log('✅ App config loaded and encrypted');
            
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
            minimumWithdrawReferrals: 0,
            adZoneId: ''
        };
    }

    async loadUserData() {
        const userRef = this.db.ref(`users/${this.tgUser.id}`);
        const snapshot = await userRef.once('value');
        let userData = snapshot.val();

        if (!userData) {
            userData = await this.createNewUser();
        }

        // تحديث البيانات اليومية
        userData = await this.updateDailyData(userData);
        
        // تشفير البيانات الحساسة
        this.userState = encryptionService.encryptSensitiveData(userData);
        
        console.log('✅ User data loaded and encrypted');
    }

    async createNewUser() {
        const startParam = this.tg.initDataUnsafe.start_param;
        const referralId = (startParam && !isNaN(startParam)) ? startParam : null;
        
        const userData = { 
            id: this.tgUser.id, 
            firstName: this.tgUser.first_name || '', 
            lastName: this.tgUser.last_name || '', 
            username: this.tgUser.username || '', 
            photoUrl: this.tgUser.photo_url || '', 
            balance: 0, 
            tub: 0, 
            referrals: 0, 
            referredBy: referralId, 
            totalEarned: 0, 
            lifetimeAdCount: 0, 
            lastAdWatchDate: '1970-01-01', 
            dailyAdCount: 0, 
            breakUntil: 0, 
            completedTasks: {}, 
            welcomed: false 
        };
        
        await this.db.ref(`users/${this.tgUser.id}`).set(userData);
        
        // مكافأة المحيل إذا وجد
        if (referralId && referralId != this.tgUser.id) {
            await this.rewardReferrer(referralId);
        }
        
        return userData;
    }

    async rewardReferrer(referralId) {
        const referrerRef = this.db.ref(`users/${referralId}`);
        const bonusAmount = 0.01;
        
        await referrerRef.transaction(currentData => {
            if (currentData) {
                currentData.tub = (currentData.tub || 0) + bonusAmount;
                currentData.referrals = (currentData.referrals || 0) + 1;
            }
            return currentData;
        });
    }

    async updateDailyData(userData) {
        const today = new Date().toISOString().slice(0, 10);
        
        if (userData.lastAdWatchDate !== today) {
            userData.dailyAdCount = 0;
            userData.lastAdWatchDate = today;
            
            await this.db.ref(`users/${this.tgUser.id}`).update({ 
                dailyAdCount: 0, 
                lastAdWatchDate: today 
            });
        }
        
        return userData;
    }

    hideLoader() {
        setTimeout(() => {
            document.getElementById('app-loader').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            
            // عرض رسالة الترحيب إذا كانت متوفرة
            if (this.appConfig.welcomeMessage && !this.userState.welcomed) {
                this.showWelcomeMessage();
            }
        }, 500);
    }

    showWelcomeMessage() {
        const popupContent = `
            <h2>Welcome!</h2>
            <p>${this.appConfig.welcomeMessage}</p>
            <button class="popup-close-btn" onclick="app.closePopup()">Continue</button>
        `;
        this.showPopup(popupContent);
        
        // تحديث حالة الترحيب
        this.db.ref(`users/${this.tgUser.id}/welcomed`).set(true);
    }

    // الدوال المساعدة
    async getUserIP() {
        try {
            const res = await fetch("https://api.ipify.org?format=json");
            const data = await res.json();
            return data.ip;
        } catch (e) {
            console.error("Failed to fetch IP:", e);
            return null;
        }
    }

    showMultiAccountError() {
        document.body.innerHTML = `
            <div style="background-color:#0d1117; color:#fff; height:100vh; display:flex; justify-content:center; align-items:center; font-family:-apple-system, BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="background:#1a1f26; border-radius:22px; padding:40px 30px; width:85%; max-width:330px; text-align:center; box-shadow:0 0 40px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.08); animation:fadeIn 0.6s ease-out;">
                    <div style="margin-bottom:24px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="75" height="75" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="animation:pulse 1.8s infinite ease-in-out;">
                            <circle cx="12" cy="12" r="10" stroke="#ff4d4d"/>
                            <line x1="15" y1="9" x2="9" y2="15" stroke="#ff4d4d"/>
                            <line x1="9" y1="9" x2="15" y2="15" stroke="#ff4d4d"/>
                        </svg>
                    </div>
                    <h2 style="font-size:18px; font-weight:600; color:#fff; letter-spacing:0.5px;">Multi accounts not allowed</h2>
                    <p style="margin-top:10px; color:#9da5b4; font-size:14px; line-height:1.5;">Access for this device has been blocked.<br>Multiple Telegram accounts detected on the same IP.</p>
                </div>
            </div>
        `;
    }

    showError(message) {
        document.getElementById('app-loader').innerHTML = `
            <div style="text-align: center; color: var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Initialization Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
            </div>
        `;
    }

    showPopup(content) {
        const popup = document.getElementById('popup');
        const popupBody = document.getElementById('popup-body');
        popupBody.innerHTML = content;
        popup.style.display = 'flex';
    }

    closePopup() {
        document.getElementById('popup').style.display = 'none';
    }

    initUI() {
        // سيتم تنفيذ هذا في ملف UI-Manager
        if (typeof uiManager !== 'undefined') {
            uiManager.init(this);
        }
    }
}

// إنشاء instance من التطبيق
const app = new TonApp();
