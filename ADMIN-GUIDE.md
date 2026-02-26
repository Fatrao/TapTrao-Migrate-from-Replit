# TapTrao Admin Guide

## 1. Activate Admin Mode

1. Go to **https://taptrao.com/admin/login**
2. Enter your `ADMIN_PASSWORD` (the one set in Railway environment variables)
3. Click **Activate Admin**
4. You'll be redirected to the dashboard — your session is now admin

Once admin, you'll see a new **Admin** section in the sidebar with:
- Promo Codes
- API Keys
- Create Alert
- Data

**Admin bypass:** As admin, all compliance checks and LC checks are free — no tokens deducted.

---

## 2. Give Free Tokens to Users (Promo Codes)

### Create a promo code

1. Go to **https://taptrao.com/admin/promo-codes**
2. Fill in:
   - **Code** — e.g. `JOHN5`, `WELCOME3`, `DEMO1` (auto-uppercased)
   - **Trade Tokens** — number of compliance check credits to give (1 token = 1 shipment)
   - **LC Credits** — number of standalone LC check credits (usually 0, since LC is included with trade tokens)
   - **Max Redemptions** — how many different users can redeem this code (default: 1)
3. Click **Create Code**

### Share with a user

Send them the code and tell them to:
1. Go to **https://taptrao.com/pricing**
2. Scroll to the **"Have a promo code?"** section
3. Enter the code and click **Redeem**
4. Their account is instantly credited

### Track usage

The promo codes table shows:
- **Used / Max** — e.g. `1 / 5` means 1 out of 5 allowed redemptions used
- **Status** — Active, Inactive, or Exhausted (all redemptions used)

### Example scenarios

| Code | Tokens | Max Redemptions | Use case |
|------|--------|-----------------|----------|
| `JOHN5` | 5 | 1 | Give John 5 free shipment checks |
| `DEMO1` | 1 | 50 | Marketing — 50 people each get 1 free check |
| `PARTNER10` | 10 | 3 | Give 3 partner companies 10 checks each |

---

## 3. API Keys (for Enterprise Clients)

### Generate an API key

1. Go to **https://taptrao.com/admin/api-keys**
2. Enter a name (e.g. "Acme Corp Production")
3. Click **Generate API Key**
4. **Copy the key immediately** — it's only shown once (format: `tt_live_...`)

### How API keys work

- API keys are linked to **your admin session's token pool**
- Enterprise clients use credits from the same balance
- They buy credits via Stripe (same pricing page) or you give them promo codes
- Rate limited: 60 requests/minute per key

### Share with an enterprise client

Send them the API key and these instructions:

```
# List available commodities
curl -H "Authorization: Bearer tt_live_YOUR_KEY_HERE" \
  https://taptrao.com/api/v1/commodities

# Run a compliance check (costs 1 credit)
curl -X POST \
  -H "Authorization: Bearer tt_live_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"commodityId":"UUID","originId":"UUID","destinationId":"UUID"}' \
  https://taptrao.com/api/v1/compliance-check

# Run an LC document check (costs 1 credit)
curl -X POST \
  -H "Authorization: Bearer tt_live_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"lcFields":{...},"documents":[...]}' \
  https://taptrao.com/api/v1/lc-check

# Check remaining credits
curl -H "Authorization: Bearer tt_live_YOUR_KEY_HERE" \
  https://taptrao.com/api/v1/balance
```

### API endpoints summary

| Method | Endpoint | Auth Required | Cost |
|--------|----------|---------------|------|
| GET | `/api/v1/commodities` | No | Free |
| GET | `/api/v1/origins` | No | Free |
| GET | `/api/v1/destinations` | No | Free |
| POST | `/api/v1/compliance-check` | Yes | 1 credit |
| POST | `/api/v1/lc-check` | Yes | 1 credit |
| GET | `/api/v1/lookups` | Yes | Free |
| GET | `/api/v1/lookups/:id` | Yes | Free |
| GET | `/api/v1/lc-checks/:id` | Yes | Free |
| GET | `/api/v1/balance` | Yes | Free |

### Revoke a key

If a key is compromised, click **Revoke** next to it on the API Keys page. It takes effect immediately.

---

## 4. Railway Setup Checklist

These environment variables must be set in Railway:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Yes | Your admin login password |
| `STRIPE_SECRET_KEY` | Yes | Must start with `sk_live_` for real payments |
| `STRIPE_WEBHOOK_SECRET` | No | For Stripe webhook verification |

### After deploying new schema changes

Run this in Railway's console or via Railway CLI:
```
npm run db:push
```

This creates/updates the database tables (promo_codes, promo_redemptions, api_keys, etc.).

---

## 5. Quick Reference

| Task | URL |
|------|-----|
| Admin login | `/admin/login` |
| Create promo codes | `/admin/promo-codes` |
| Manage API keys | `/admin/api-keys` |
| Create regulatory alert | `/admin/alerts/new` |
| Admin data management | `/admin/data` |
| User pricing page (where they redeem codes) | `/pricing` |
