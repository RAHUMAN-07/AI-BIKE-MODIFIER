# Phase 1 Setup Guide: Firebase + Supabase Configuration

This guide walks you through setting up **Firebase Firestore** and **Supabase Storage** for the MotoForge AI backend.

## Prerequisites

- Google/Firebase account: https://firebase.google.com
- Supabase account: https://supabase.com
- `.env` file in the project root (see `.env.example`)

---

## Step 1: Set up Firebase Firestore

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it (e.g., "motoforge-ai")
4. Accept the terms and click **"Create project"**
5. Wait for provisioning to complete

### 1.2 Create a Firestore Database

1. In Firebase Console, go to **Firestore Database** (left menu)
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll set security rules later)
4. Choose region closest to you (e.g., `us-central1`)
5. Click **"Enable"**

### 1.3 Generate Service Account Key

1. Go to **Project Settings** (gear icon, top-right)
2. Click the **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. Save the JSON file securely
5. Open the JSON file and copy these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` escape sequences)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `database_url` → `FIREBASE_DATABASE_URL` (from Firebase Console URL bar)

### 1.4 Update `.env`

```bash
FIREBASE_PROJECT_ID=motoforge-ai
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@motoforge-ai.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://motoforge-ai.firebaseio.com
```

### 1.5 Set Firestore Security Rules (Optional but Recommended)

1. In Firestore Database, click the **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads/writes to any document if authenticated
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // For now, allow public access (development only)
    // Comment out above and uncomment below for production
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}
```

3. Click **"Publish"**

---

## Step 2: Set up Supabase Storage

### 2.1 Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New project"**
3. Name it (e.g., "motoforge-storage")
4. Create a strong database password
5. Select your region
6. Click **"Create new project"**
7. Wait for provisioning (~2 minutes)

### 2.2 Get API Keys

1. In Supabase Dashboard, go to **Settings** (gear icon, bottom-left)
2. Click **"API"** tab
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`

### 2.3 Create Storage Buckets

1. In Supabase, go to **Storage** (left menu)
2. Click **"Create bucket"** and name it `motoforge-images`
3. Set it as **Public** (so URLs are accessible)
4. Click **"Create bucket"** and name it `motoforge-models`
5. Set it as **Public**

### 2.4 Update `.env`

```bash
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Test the Integration

### 3.1 Restart the Backend

```bash
cd "c:\Users\Lenovo\Desktop\AI bike modification\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

If `.env` is configured, you should see:
```
✅ Firebase initialized successfully
```

### 3.2 Test Upload Endpoint

Using PowerShell:
```powershell
$file = @{
    file = Get-Item "path\to\your\bike_image.jpg"
}
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/upload" -Method Post -Form $file
$response | ConvertTo-Json
```

Expected response:
```json
{
  "sessionId": "abc123...",
  "imageUrl": "https://your-supabase-url.com/storage/v1/object/public/motoforge-images/uploads/..."
}
```

### 3.3 Verify in Firebase Console

1. Go to Firestore Database
2. You should see a `sessions` collection
3. Click it to view the saved session document

---

## Step 4: Update Frontend (Optional)

If you want the frontend to authenticate with Firebase:

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** or **Google** sign-in
4. Copy the Firebase Config JSON from Project Settings
5. Add to frontend `.env`:

```bash
VITE_FIREBASE_CONFIG_JSON={"apiKey":"...","projectId":"...","storageBucket":"..."}
```

---

## Troubleshooting

### "Firebase credentials not configured"

- Ensure all 4 Firebase env variables are set correctly
- Check that `FIREBASE_PRIVATE_KEY` has proper escaped newlines (`\n`)
- Restart the backend after updating `.env`

### "Supabase upload failed"

- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Make sure buckets `motoforge-images` and `motoforge-models` exist
- Check bucket permissions are set to **Public**

### Connection timeout

- Verify your internet connection
- Check firewall/VPN isn't blocking Firebase/Supabase
- Try pinging `firebase.google.com` and `supabase.co`

---

## Next Steps

1. ✅ Phase 1 Complete: Storage & Database
2. **Phase 2**: Integrate TRELLIS/Hunyuan3D for Image→3D
3. **Phase 3**: Wire frontend 3D viewer and parts detection
4. **Phase 4**: Deploy to production

Ready to proceed with Phase 2?
