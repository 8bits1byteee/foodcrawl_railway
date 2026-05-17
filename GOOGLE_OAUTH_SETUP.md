# Google OAuth 2.0 Setup Instructions

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it something like "FoodCrawl Login"

## Step 2: Enable Google Sign-In API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: FoodCrawl Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost`
     - `http://localhost:80`
     - `http://127.0.0.1`
     - Add your production domain when deploying
   - **Authorized redirect URIs**: 
     - `http://localhost/foodcrawl`
     - Add your production URLs
5. Click **Create**
6. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

## Step 4: Update Your Code

Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` in the following files:

### File 1: `index.php`
```php
<!-- Line ~17 -->
<meta name="google-signin-client_id" content="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com">

<!-- Line ~120 (inside login modal) -->
<div id="g_id_onload"
     data-client_id="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleGoogleCredentialResponse"
     data-auto_prompt="false">
</div>
```

### File 2: `js/script.js`
```javascript
// Line ~2675 (inside openLoginModal function)
google.accounts.id.initialize({
    client_id: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
    callback: handleGoogleCredentialResponse
});
```

## Step 5: Test the Integration

1. Open your website: `http://localhost/foodcrawl`
2. Try to add a review (click "Add Review" button)
3. Click "Log in with Google" in the login modal
4. Select your Google account
5. Grant permissions
6. You should be logged in and redirected to the review form

## How It Works

1. **User clicks "Log in with Google"** → Triggers `handleGoogleLogin()`
2. **Google popup appears** → User selects their Google account
3. **Google returns JWT token** → Contains user's email, name, and profile picture
4. **Token is decoded** → `handleGoogleCredentialResponse()` parses the token
5. **User data is stored** → Saved in `localStorage` as `foodcrawl_user`
6. **Review form opens** → User can now submit reviews with their Google name

## Security Notes

- Never expose your OAuth client secret in frontend code
- Always validate tokens on the backend in production
- Use HTTPS in production environments
- Set up proper CORS policies

## Troubleshooting

### "Google Sign-In is loading. Please try again in a moment."
- Wait a few seconds for the Google library to load
- Check your internet connection
- Verify the Google Sign-In script is loaded in `<head>`

### "Unauthorized JavaScript origin"
- Add your domain to authorized origins in Google Cloud Console
- Make sure URL matches exactly (including port number)

### Token parsing errors
- Check browser console for JWT parsing errors
- Verify the credential response is being received

## Production Deployment

When deploying to production:

1. Add your production domain to Google Cloud Console authorized origins
2. Update the `client_id` in all files
3. Consider implementing backend token verification
4. Use environment variables for the client ID
5. Enable HTTPS (required by Google for production)

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Overview](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In JavaScript Guide](https://developers.google.com/identity/gsi/web/guides/overview)
