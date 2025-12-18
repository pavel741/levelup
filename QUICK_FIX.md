# 🚨 QUICK FIX - Exposed Resend API Key

## IMMEDIATE ACTIONS (Do in this order!)

### 1. Revoke the Key (2 minutes)
1. Go to https://resend.com/api-keys
2. Delete key: `re_XkRi85uR_3KKGkNrkvxdhVyk4d9Bh79oL`
3. Create a new API key
4. Copy the new key

### 2. Update Vercel (1 minute)
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `RESEND_API_KEY` with new key
3. Redeploy

### 3. Update Local (.env.local) (30 seconds)
Update `RESEND_API_KEY` in your `.env.local` file

### 4. Remove from Git History (5 minutes)

**Option A: Simple (if you're the only contributor)**
```bash
# Remove the file from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch PRODUCTION_CHECKLIST.md" \
  --prune-empty --tag-name-filter cat -- --all

# Replace key with REDACTED
git filter-branch --force --tree-filter \
  "find . -type f -name '*.md' -exec sed -i '' 's/re_XkRi85uR_3KKGkNrkvxdhVyk4d9Bh79oL/REDACTED/g' {} +" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: Rewrites history!)
git push origin --force --all
```

**Option B: Using BFG Repo-Cleaner (Recommended)**
1. Download: https://rtyley.github.io/bfg-repo-cleaner/
2. Create `passwords.txt`:
   ```
   re_XkRi85uR_3KKGkNrkvxdhVyk4d9Bh79oL==>REDACTED
   ```
3. Run:
   ```bash
   java -jar bfg.jar --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin --force --all
   ```

**Option C: GitHub Support (If you can't rewrite history)**
- Contact GitHub Support
- They can help remove sensitive data from history
- Or create a new repository and push fresh code

## ✅ Verification

After fixing, verify:
```bash
# Check if key still exists in history
git log --all --source --full-history -- "*" | grep "re_XkRi85uR"

# Should return nothing if successful
```

## 🔒 Prevention

- ✅ `.gitignore` updated to exclude secrets
- ✅ Never commit real API keys
- ✅ Use placeholders in documentation
- ✅ Use environment variables only

