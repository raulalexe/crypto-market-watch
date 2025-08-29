# Manual Testing Checklist

## 🧪 Test Environment Setup
- [ ] Server running on port 3001
- [ ] Client running on port 3000
- [ ] Database initialized and populated with test data
- [ ] All dependencies installed (`npm install` in root and client directories)

## 🔐 Authentication & User Management

### Registration Flow
- [ ] **New User Registration**
  - [ ] Navigate to homepage
  - [ ] Click "Sign Up" button
  - [ ] Fill email and password fields
  - [ ] Submit registration form
  - [ ] Verify email confirmation modal appears
  - [ ] Check console for confirmation link (development mode)
  - [ ] Click confirmation link in console
  - [ ] Verify account activation and auto-login

- [ ] **Duplicate Email Registration**
  - [ ] Try to register with existing email
  - [ ] Verify "User already exists" error message

- [ ] **Invalid Registration Data**
  - [ ] Submit empty form
  - [ ] Submit with invalid email format
  - [ ] Submit with short password
  - [ ] Verify appropriate error messages

### Login Flow
- [ ] **Valid Login**
  - [ ] Click "Sign In" button
  - [ ] Enter valid credentials
  - [ ] Verify successful login and redirect to dashboard
  - [ ] Check that auth token is stored in localStorage

- [ ] **Invalid Login**
  - [ ] Enter incorrect email/password
  - [ ] Verify error message display
  - [ ] Verify no token is stored

- [ ] **Logout**
  - [ ] Click logout button in profile
  - [ ] Verify token removal from localStorage
  - [ ] Verify redirect to homepage

### Profile Management
- [ ] **Profile Page Access**
  - [ ] Navigate to `/profile` while logged in
  - [ ] Verify profile information display
  - [ ] Test edit functionality
  - [ ] Save changes and verify updates

- [ ] **Unauthenticated Access**
  - [ ] Navigate to `/profile` while logged out
  - [ ] Verify redirect to auth-required page

## 📊 Dashboard & Market Data

### Market Dashboard
- [ ] **Data Display**
  - [ ] Verify crypto prices are displayed
  - [ ] Check Fear & Greed Index
  - [ ] Verify AI analysis sections (short/medium/long term)
  - [ ] Test data refresh functionality

- [ ] **Loading States**
  - [ ] Check loading indicators during data fetch
  - [ ] Verify error handling for failed requests

- [ ] **Responsive Design**
  - [ ] Test on desktop (1280px+)
  - [ ] Test on tablet (768px-1279px)
  - [ ] Test on mobile (<768px)
  - [ ] Verify sidebar collapse/expand on mobile

### Historical Data
- [ ] **Data Visualization**
  - [ ] Navigate to `/history`
  - [ ] Verify chart displays correctly
  - [ ] Test date range selection
  - [ ] Test symbol selection
  - [ ] Verify data export functionality

## 🔔 Alert System

### Alert Display
- [ ] **Header Alert Icon**
  - [ ] Verify alert icon appears in header
  - [ ] Check unread count display
  - [ ] Test alert popup on click
  - [ ] Verify alert acknowledgment

- [ ] **Alert Page**
  - [ ] Navigate to `/alerts`
  - [ ] Verify all alerts are listed
  - [ ] Test alert filtering
  - [ ] Check alert details

### Alert Creation (Premium+)
- [ ] **Custom Alert Thresholds**
  - [ ] Navigate to `/custom-alerts`
  - [ ] Create new alert threshold
  - [ ] Set conditions (price, SSR, dominance)
  - [ ] Save and verify creation
  - [ ] Test alert triggering

## 💰 Subscription & Access Control

### Free Plan Features
- [ ] **Accessible Features**
  - [ ] Market dashboard
  - [ ] Basic historical data
  - [ ] Limited data export

- [ ] **Restricted Features**
  - [ ] Try to access `/alerts` - should show upgrade prompt
  - [ ] Try to access `/settings` - should show upgrade prompt
  - [ ] Try to access `/advanced-analytics` - should redirect to auth-required

### Pro Plan Features
- [ ] **Accessible Features**
  - [ ] All Free features
  - [ ] Real-time alerts
  - [ ] Email & push notifications
  - [ ] Historical data
  - [ ] Data export

- [ ] **Restricted Features**
  - [ ] Try to access `/advanced-analytics` - should show premium upgrade prompt
  - [ ] Try to access `/advanced-export` - should show premium upgrade prompt
  - [ ] Try to access `/custom-alerts` - should show premium upgrade prompt

### Premium+ Plan Features
- [ ] **Accessible Features**
  - [ ] All Pro features
  - [ ] Advanced Analytics (`/advanced-analytics`)
  - [ ] Advanced Data Export (`/advanced-export`)
  - [ ] Custom Alert Thresholds (`/custom-alerts`)
  - [ ] Priority notification delivery

### Admin Access
- [ ] **Admin Dashboard**
  - [ ] Navigate to `/admin`
  - [ ] Verify admin-only access
  - [ ] Check data collections display
  - [ ] Test data export functionality
  - [ ] Verify error logs access

## 📈 Advanced Features

### Advanced Analytics
- [ ] **Portfolio Metrics**
  - [ ] Navigate to `/advanced-analytics`
  - [ ] Verify portfolio value calculation
  - [ ] Check volatility metrics
  - [ ] Test Sharpe ratio display

- [ ] **Risk Analysis**
  - [ ] Verify VaR calculations
  - [ ] Check drawdown analysis
  - [ ] Test correlation matrix

- [ ] **Interactive Charts**
  - [ ] Test chart interactions
  - [ ] Verify data point tooltips
  - [ ] Check chart type switching

### Advanced Data Export
- [ ] **Export Formats**
  - [ ] Test CSV export
  - [ ] Test JSON export
  - [ ] Test XLSX export
  - [ ] Test PDF export
  - [ ] Test XML export

- [ ] **Scheduled Exports**
  - [ ] Set up daily export
  - [ ] Set up weekly export
  - [ ] Set up monthly export
  - [ ] Verify export history

- [ ] **Custom Date Ranges**
  - [ ] Select custom start date
  - [ ] Select custom end date
  - [ ] Verify data filtering

## 🔧 Settings & Configuration

### Notification Settings
- [ ] **Email Notifications**
  - [ ] Enable/disable email notifications
  - [ ] Test email delivery (if configured)

- [ ] **Push Notifications**
  - [ ] Enable push notifications
  - [ ] Test notification permission
  - [ ] Verify notification delivery

- [ ] **Telegram Notifications**
  - [ ] Add Telegram chat ID
  - [ ] Test Telegram bot connection
  - [ ] Verify message delivery

### User Preferences
- [ ] **Theme Settings**
  - [ ] Test dark/light mode toggle (if implemented)
  - [ ] Verify theme persistence

- [ ] **Language Settings**
  - [ ] Test language selection (if implemented)
  - [ ] Verify translation display

## 🚀 Performance & Error Handling

### Performance Testing
- [ ] **Page Load Times**
  - [ ] Measure dashboard load time
  - [ ] Check data fetch performance
  - [ ] Test with large datasets

- [ ] **Memory Usage**
  - [ ] Monitor memory consumption
  - [ ] Check for memory leaks
  - [ ] Test long-running sessions

### Error Handling
- [ ] **Network Errors**
  - [ ] Disconnect internet and test
  - [ ] Verify error messages
  - [ ] Test retry functionality

- [ ] **Server Errors**
  - [ ] Stop server and test client
  - [ ] Verify graceful error handling
  - [ ] Check error logging

- [ ] **Invalid Data**
  - [ ] Test with malformed API responses
  - [ ] Verify data validation
  - [ ] Check fallback behavior

## 🔒 Security Testing

### Authentication Security
- [ ] **Token Validation**
  - [ ] Test with invalid tokens
  - [ ] Test with expired tokens
  - [ ] Verify token refresh (if implemented)

- [ ] **Route Protection**
  - [ ] Try to access protected routes without auth
  - [ ] Verify proper redirects
  - [ ] Test admin-only routes

### Data Security
- [ ] **Input Validation**
  - [ ] Test SQL injection attempts
  - [ ] Test XSS attempts
  - [ ] Verify input sanitization

- [ ] **API Security**
  - [ ] Test unauthorized API access
  - [ ] Verify rate limiting
  - [ ] Check CORS configuration

## 📱 Cross-Browser Testing

### Browser Compatibility
- [ ] **Chrome** (Latest)
  - [ ] All features working
  - [ ] No console errors
  - [ ] Responsive design

- [ ] **Firefox** (Latest)
  - [ ] All features working
  - [ ] No console errors
  - [ ] Responsive design

- [ ] **Safari** (Latest)
  - [ ] All features working
  - [ ] No console errors
  - [ ] Responsive design

- [ ] **Edge** (Latest)
  - [ ] All features working
  - [ ] No console errors
  - [ ] Responsive design

## 🧹 Cleanup & Maintenance

### Data Cleanup
- [ ] **Test Data Removal**
  - [ ] Remove test users
  - [ ] Clear test alerts
  - [ ] Reset database to clean state

- [ ] **Log Cleanup**
  - [ ] Clear error logs
  - [ ] Remove test files
  - [ ] Clean up temporary data

## 📋 Test Results Summary

### Passed Tests
- [ ] List all passed test scenarios

### Failed Tests
- [ ] Document failed test scenarios
- [ ] Note error messages
- [ ] Record browser/device information

### Performance Metrics
- [ ] Average page load time: _____ ms
- [ ] Memory usage: _____ MB
- [ ] API response time: _____ ms

### Issues Found
- [ ] List all discovered issues
- [ ] Priority level (High/Medium/Low)
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior

---

**Test Date:** ___________  
**Tester:** ___________  
**Environment:** ___________  
**Version:** ___________
