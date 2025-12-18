# Security Incident Response - Exposed Resend API Key

## ⚠️ IMMEDIATE ACTION REQUIRED

Your Resend API key was detected in your GitHub repository. Follow these steps immediately:

## Step 1: Revoke the Exposed Key (DO THIS FIRST!)

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Find the key: `re_XkRi85uR_3KKGkNrkvxdhVyk4d9Bh79oL`
3. **Delete/Revoke it immediately**
4. This prevents anyone from using the exposed key

## Step 2: Generate a New API Key

1. In Resend Dashboard → API Keys
2. Click "Create API Key"
3. Give it a name (e.g., "LevelUp Production")
4. Copy the new key (you'll only see it once!)

## Step 3: Update Environment Variables

### Local Development (.env.local)
Update your `.env.local` file:
```env
RESEND_API_KEY=your_new_api_key_here
```

### Vercel Production
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `RESEND_API_KEY`
3. Update it with your new key
4. Redeploy your application

## Step 4: Remove Key from Git History (If Committed)

If the key was committed to git, you need to remove it from history:

### Option A: Using git-filter-repo (Recommended)
```bash
# Install git-filter-repo if needed
pip install git-filter-repo

# Remove the key from all commits
git filter-repo --invert-paths --path-glob '*.md' --path PRODUCTION_CHECKLIST.md
git filter-repo --replace-text <(echo 're_XkRi85uR_3KKGkNrkvxdhVyk4d9Bh79oL==>REDACTED')
```

### Option B: Using BFG Repo-Cleaner
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Option C: Force Push (If you're the only contributor)
```bash
# WARNING: This rewrites history. Only do this if you're the only contributor!
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch PRODUCTION_CHECKLIST.md" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

## Step 5: Verify .gitignore

Make sure `.env*.local` is in `.gitignore` (it should already be there).

## Step 6: Check for Other Exposed Secrets

Run these commands to check for other secrets:
```bash
# Check for API keys
git log --all --source --full-history -- "*" | grep -i "api.*key"

# Check for secrets
git log --all --source --full-history -- "*" | grep -i "secret"

# Check environment files
git log --all --source --full-history -- ".env*"
```

## Prevention for Future

1. **Never commit secrets** - Always use environment variables
2. **Use placeholder values** in documentation:
   - ❌ `RESEND_API_KEY=re_XkRi85uR_3KKGkNrkvxdhVyk4d9Bh79oL`
   - ✅ `RESEND_API_KEY=your_resend_api_key_here`
3. **Use GitHub Secrets** for CI/CD
4. **Use Vercel Environment Variables** for production
5. **Enable secret scanning** in GitHub repository settings

## Files That May Have Contained the Key

Based on the deleted files, these may have had the key:
- `PRODUCTION_CHECKLIST.md` (deleted)
- `DEPLOYMENT.md` (deleted)
- `DEVELOPMENT.md` (deleted)

Check git history for these files if they were committed.

## Next Steps

1. ✅ Revoke old key
2. ✅ Generate new key
3. ✅ Update environment variables
4. ✅ Remove from git history (if needed)
5. ✅ Verify .gitignore
6. ✅ Update Vercel with new key
7. ✅ Redeploy application

## Monitoring

- Check Resend dashboard for any suspicious activity
- Monitor email sending logs
- Set up alerts for unusual API usage

