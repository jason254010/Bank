import fs from 'fs';
import path from 'path';

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

function getFirebaseApiKey(): string | null {
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY.trim()) {
    return process.env.FIREBASE_API_KEY.trim();
  }
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (cfg.apiKey && typeof cfg.apiKey === 'string') {
        return cfg.apiKey.trim();
      }
    }
  } catch (err) {
    console.error('[FIREBASE CONFIG READ ERROR]', err);
  }
  return null;
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink?: string,
  recipientName: string = 'User'
): Promise<SendEmailResult> {
  const apiKey = getFirebaseApiKey();

  if (!apiKey) {
    const errorMsg = 'Firebase API key is missing or not configured. Cannot send password reset email.';
    console.error(`[FIREBASE EMAIL ERROR] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const cleanEmail = toEmail.trim().toLowerCase();

  try {
    // 1. Attempt sendOobCode via Firebase Auth REST API (free Spark plan built-in email reset)
    let res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: cleanEmail
      })
    });

    let data = await res.json();

    // 2. If email is not in Firebase Auth yet, auto-provision user in Firebase Auth and retry
    if (data?.error?.message?.includes('EMAIL_NOT_FOUND')) {
      const tempPassword = 'TempPassword' + Math.random().toString(36).substring(2) + '!';
      const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: tempPassword,
          returnSecureToken: true
        })
      });
      await signUpRes.json();

      // Retry sendOobCode
      res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: cleanEmail
        })
      });
      data = await res.json();
    }

    if (data?.error) {
      const errMsg = data.error.message || 'Firebase Auth error during password reset email dispatch.';
      console.error(`[FIREBASE AUTH ERROR] ${errMsg}`);
      return { success: false, error: errMsg };
    }

    console.log(`[FIREBASE AUTH EMAIL DISPATCHED] Reset email sent to ${cleanEmail}`);
    return { success: true, id: `firebase-${Date.now()}` };
  } catch (err: any) {
    const errMsg = err?.message || 'Unknown network error when connecting to Firebase Auth';
    console.error(`[FIREBASE AUTH EXCEPTION] ${errMsg}`);
    return { success: false, error: errMsg };
  }
}
