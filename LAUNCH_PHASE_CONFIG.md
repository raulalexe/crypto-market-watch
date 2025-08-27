# Launch Phase Configuration

## Overview
The application supports a "launch phase" mode where Pro and Premium subscription plans are marked as "Coming Soon" and disabled for new subscriptions.

## Environment Variable

To enable launch phase mode, set the following environment variable:

```bash
REACT_APP_LAUNCH_PHASE=true
```

## Features

When launch phase is enabled:

### Frontend Changes:
1. **Subscription Plans Page**:
   - Pro and Premium plans show "Coming Soon" badges
   - Subscribe buttons are disabled and show "Coming Soon"
   - Plans appear with reduced opacity
   - Launch phase banner appears at the top

2. **Dashboard**:
   - "Upgrade to Pro" button becomes "Coming Soon" badge
   - Non-clickable for users without subscriptions

### Backend Changes:
- Subscription endpoints remain functional for existing users
- New subscription attempts for Pro/Premium are blocked with appropriate messages

## Usage

### Enable Launch Phase:
```bash
export REACT_APP_LAUNCH_PHASE=true
npm start
```

### Disable Launch Phase (Normal Mode):
```bash
export REACT_APP_LAUNCH_PHASE=false
npm start
```

## Implementation Details

The launch phase feature is implemented in:

1. **`client/src/components/SubscriptionPlans.js`**:
   - Checks `process.env.REACT_APP_LAUNCH_PHASE`
   - Renders "Coming Soon" UI for Pro/Premium plans
   - Disables subscription buttons

2. **`client/src/components/Dashboard.js`**:
   - Updates subscription button to show "Coming Soon"
   - Prevents navigation to subscription page

## Testing

To test the launch phase:

1. Set `REACT_APP_LAUNCH_PHASE=true` in your environment
2. Restart the React development server
3. Visit the subscription plans page
4. Verify Pro and Premium plans show "Coming Soon"
5. Verify dashboard shows "Coming Soon" instead of "Upgrade to Pro"

## Production Deployment

For production deployment, set the environment variable in your hosting platform:

- **Vercel**: Add `REACT_APP_LAUNCH_PHASE=true` in Environment Variables
- **Railway**: Add `REACT_APP_LAUNCH_PHASE=true` in Variables
- **Heroku**: `heroku config:set REACT_APP_LAUNCH_PHASE=true`
