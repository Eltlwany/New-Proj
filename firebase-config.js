// البيانات المشفرة لـ Firebase
const ENCRYPTED_FIREBASE_CONFIG = {
    apiKey: "UUdacGhGcFdNVFJ6ZFRsYU5tWk9SR0p6VmpCYWJYbG1XbFJhYWs1dFNYaE5la1Y2",
    authDomain: "bGFzdGVyLTgyN2Y3LmZpcmViYXNlYXBwLmNvbQ==",
    projectId: "bGFzdGVyLTgyN2Y3",
    storageBucket: "bGFzdGVyLTgyN2Y3LmZpcmViYXNlc3RvcmFnZS5hcHA=",
    messagingSenderId: "NDY5NDQwNzM0OTg1",
    appId: "MToxNjoxMjM6NDU2Ojc4OTowMTI6MzQ1Njo2Nzg5",
    measurementId: "R00tNEY5R0RYQjMwNw=="
};

// فك التشفير
function decryptFirebaseConfig() {
    const config = {};
    for (const [key, value] of Object.entries(ENCRYPTED_FIREBASE_CONFIG)) {
        try {
            config[key] = atob(value);
        } catch {
            config[key] = value;
        }
    }
    return config;
}

const firebaseConfig = decryptFirebaseConfig();
