# Git authentication setup

## Option A: SSH (recommended) — already set up

An SSH key was generated and your `origin` remote now uses SSH.

### 1. Add the public key to GitHub

1. Copy this entire line (your public key):

   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO2Ijz4/Fm9fD5KpXqfj2mpbdn1f9QRNrlUxDfHYWnXK gwaldon-afk@users.noreply.github.com
   ```

2. Open **GitHub → Settings → SSH and GPG keys**:  
   https://github.com/settings/keys

3. Click **New SSH key**.

4. **Title:** e.g. `Cityfleet PC`  
   **Key type:** Authentication Key  
   **Key:** paste the line above.

5. Click **Add SSH key**.

### 2. Test and push

From the project folder:

```powershell
ssh -T git@github.com
git push -u origin main
```

You should see: `Hi gwaldon-afk! You've successfully authenticated...`

---

## Option B: Personal Access Token (PAT)

Use this if you prefer HTTPS instead of SSH.

### 1. Create a token on GitHub

1. Open **GitHub → Settings → Developer settings → Personal access tokens**:  
   https://github.com/settings/tokens

2. **Tokens (classic)** → **Generate new token (classic)**.

3. **Note:** e.g. `Cityfleet Git`  
   **Expiration:** 90 days or No expiration  
   **Scopes:** enable **repo**.

4. **Generate token** and copy the token once (it won’t be shown again).

### 2. Use the token with your repo

Switch the remote back to HTTPS and push (Git will ask for credentials):

```powershell
cd "c:\Users\gwald\OneDrive\Documents\City Fleet\Cityfleet App"
git remote set-url origin https://github.com/gwaldon-afk/Cityfleet.git
git push -u origin main
```

When prompted:

- **Username:** `gwaldon-afk`
- **Password:** paste the **token** (not your GitHub password)

Windows will offer to save the credentials so you don’t have to re-enter them.

---

**Current remote:** `origin` is set to **SSH** (`git@github.com:gwaldon-afk/Cityfleet.git`).  
Complete **Option A** above to push without a password.
