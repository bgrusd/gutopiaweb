# Formspree Setup Guide for Beta Signups

## Quick Setup (5 minutes)

### Step 1: Create Formspree Account
1. Go to [Formspree.io](https://formspree.io)
2. Sign up for a free account (50 submissions/month free)
3. Click "New Form" button

### Step 2: Configure Your Form
1. Name your form: "Gutopia Beta Signups"
2. Add your email address where you want to receive submissions
3. Copy your Form ID (looks like: `xyzabcde`)

### Step 3: Update beta-signup.html
Replace `YOUR_FORMSPREE_ID` in the form action with your actual Form ID:

```html
<form id="betaSignupForm" action="https://formspree.io/f/YOUR_FORMSPREE_ID" method="POST">
```

For example:
```html
<form id="betaSignupForm" action="https://formspree.io/f/xyzabcde" method="POST">
```

### Step 4: Test Your Form
1. Open beta-signup.html in your browser
2. Fill out and submit the test form
3. Check your email for the submission
4. Check Formspree dashboard for the submission

## Data You'll Receive

Each submission will include:
- **name**: Full name of the beta tester
- **email**: Email address for contact
- **platform**: iOS, Android, or Both
- **condition**: Their primary condition (optional)
- **timestamp**: When they signed up
- **_subject**: "New Gutopia Beta Signup!" (for easy email filtering)

## Formspree Features

### Free Plan Includes:
- 50 submissions per month
- Email notifications
- Submission archive
- Spam filtering
- File uploads (if needed)

### Optional Upgrades:
- Custom redirect URL after submission
- Webhooks for automation
- Team collaboration
- CSV/JSON exports
- More submissions per month

## Export to Google Sheets (Optional)

If you want to automatically save to Google Sheets:

1. In Formspree dashboard, go to your form
2. Click "Integrations"
3. Select "Google Sheets"
4. Connect your Google account
5. Select or create a spreadsheet
6. Map form fields to columns

## Email Configuration

### To customize email notifications:
1. Go to form settings in Formspree
2. Click "Email Notifications"
3. Customize:
   - Subject line template
   - Reply-to address
   - CC/BCC recipients
   - Email format (HTML/Plain)

### Recommended email subject:
```
Beta Signup: {{name}} - {{platform}}
```

## Adding CAPTCHA (Recommended)

To prevent spam:
1. Go to form settings
2. Enable reCAPTCHA
3. Add to your form HTML:

```html
<div class="g-recaptcha" data-sitekey="YOUR_RECAPTCHA_KEY"></div>
```

## Automation Ideas

### TestFlight/Play Store Integration:
1. Use Formspree webhooks to trigger automation
2. Connect to Zapier or Make.com
3. Automatically:
   - Add to TestFlight
   - Send welcome email
   - Add to CRM/mailing list

### Email Templates:
Create an automated welcome email:
```
Hi {{name}},

Thank you for signing up for Gutopia beta testing!

We'll be sending you a {{platform}} testing invitation soon.

Best regards,
The Gutopia Team
```

## Troubleshooting

### Form not submitting?
- Check browser console for errors
- Verify Form ID is correct
- Ensure JavaScript is enabled

### Not receiving emails?
- Check spam folder
- Verify email in Formspree settings
- Check Formspree dashboard for submissions

### Rate limited?
- Upgrade plan for more submissions
- Or use multiple forms for different platforms

## Support

- Formspree Docs: https://help.formspree.io
- Email: support@formspree.io
- Your form dashboard: https://formspree.io/forms/YOUR_FORM_ID