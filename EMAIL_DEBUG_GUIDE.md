# Email Debugging Guide

## 🔍 Current Status

Your email service is **configured correctly** and **sending emails successfully**. The tests show:
- ✅ Brevo API connection working
- ✅ Email service initialized properly
- ✅ Test emails being sent successfully

## 🚨 Common Issues & Solutions

### 1. **Emails Not Received**

**Possible Causes:**
- Sender email not verified in Brevo dashboard
- Emails going to spam/junk folder
- Email address typos
- Brevo account limitations

**Solutions:**
1. **Check Brevo Dashboard:**
   - Go to [Brevo Dashboard](https://app.brevo.com/)
   - Navigate to **Settings** → **Senders & IP**
   - Verify your sender email `info@crypto-market-watch.xyz` is verified
   - If not verified, follow the verification process

2. **Check Spam Folder:**
   - Look in spam/junk folder
   - Add sender to contacts/whitelist
   - Check email filters

3. **Test with Different Email:**
   ```bash
   node test-send-email.js your-real-email@domain.com
   ```

### 2. **Specific Email Types Not Working**

**Email Types in Your App:**
- **Welcome emails** - Sent after email confirmation
- **Alert emails** - Sent for market alerts
- **Confirmation emails** - Sent during registration
- **Password reset emails** - Sent when resetting password

**Debug Steps:**
1. **Check server logs** for specific email sending errors
2. **Test each email type** using the admin endpoint:
   ```bash
   # Test welcome email
   curl -X POST http://localhost:3001/api/admin/test-email \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"email": "your@email.com", "type": "welcome"}'
   
   # Test alert email
   curl -X POST http://localhost:3001/api/admin/test-email \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"email": "your@email.com", "type": "alert"}'
   ```

### 3. **Brevo Account Issues**

**Check Your Brevo Account:**
1. **Account Status:**
   - Go to Brevo Dashboard
   - Check if account is active
   - Verify API key permissions

2. **Sending Limits:**
   - Free accounts have daily sending limits
   - Check if you've exceeded limits
   - Upgrade if needed

3. **Domain Verification:**
   - Verify your domain `crypto-market-watch.xyz`
   - Set up SPF, DKIM, and DMARC records
   - This improves deliverability

### 4. **Application-Specific Issues**

**Check These Scenarios:**
1. **User Registration:**
   - Are confirmation emails being sent?
   - Check registration flow in your app

2. **Market Alerts:**
   - Are users subscribed to email alerts?
   - Check user notification preferences
   - Verify alert conditions are met

3. **Password Reset:**
   - Test password reset flow
   - Check if reset emails are sent

## 🧪 Testing Steps

### Step 1: Test with Real Email
```bash
# Replace with your real email
node test-send-email.js your-real-email@domain.com
```

### Step 2: Check Brevo Dashboard
1. Go to [Brevo Dashboard](https://app.brevo.com/)
2. Check **Statistics** → **Email Activity**
3. Look for your test emails
4. Check delivery status

### Step 3: Test Application Flow
1. **Register a new user** - Check if confirmation email is sent
2. **Trigger a market alert** - Check if alert emails are sent
3. **Reset password** - Check if reset email is sent

### Step 4: Check Server Logs
Look for these log messages:
- `✅ Alert email sent to user@email.com: messageId`
- `✅ Welcome email sent to user@email.com: messageId`
- `❌ Error sending alert email: error details`

## 🔧 Quick Fixes

### Fix 1: Verify Sender Email
1. Go to Brevo Dashboard → Settings → Senders & IP
2. Verify `info@crypto-market-watch.xyz`
3. Follow verification steps

### Fix 2: Check Domain Settings
1. Add SPF record: `v=spf1 include:spf.brevo.com ~all`
2. Add DKIM record (provided by Brevo)
3. Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@crypto-market-watch.xyz`

### Fix 3: Test with Different Email Provider
Try sending to:
- Gmail
- Outlook
- Yahoo
- Your own domain email

## 📊 Monitoring

### Check Email Delivery Status
1. **Brevo Dashboard:**
   - Statistics → Email Activity
   - Check delivery rates
   - Look for bounces/blocks

2. **Server Logs:**
   - Monitor email sending logs
   - Check for error messages
   - Track success rates

### Set Up Alerts
1. **Brevo Alerts:**
   - Set up delivery failure alerts
   - Monitor bounce rates
   - Track reputation

2. **Application Logs:**
   - Monitor email sending errors
   - Track user complaints
   - Check feedback loops

## 🆘 Still Not Working?

If emails are still not being received:

1. **Contact Brevo Support:**
   - Check account status
   - Verify API key
   - Review sending limits

2. **Check Network/Firewall:**
   - Ensure outbound SMTP is allowed
   - Check for blocked IPs
   - Verify DNS resolution

3. **Test with Alternative:**
   - Try SMTP instead of API
   - Use different email service
   - Test with simple email client

## 📞 Support Resources

- **Brevo Support:** https://help.brevo.com/
- **Brevo API Docs:** https://developers.brevo.com/
- **Email Deliverability Guide:** https://help.brevo.com/hc/en-us/articles/209467485

---

**Remember:** The email service is working correctly. The issue is likely with delivery or verification, not the code.
