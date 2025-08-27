# Manual Testing Checklist

## 🚀 Quick Start Testing

### Prerequisites
- [ ] Server running on localhost:3001
- [ ] Client running on localhost:3000
- [ ] Database initialized with test data
- [ ] Admin user created (admin@example.com)

---

## 🔐 Authentication Tests

### Login Flow
- [ ] **Admin Login**
  - Navigate to login page
  - Enter admin@example.com / admin123
  - Verify successful login
  - Check admin privileges

- [ ] **Invalid Login**
  - Try wrong password
  - Try non-existent email
  - Verify error messages display

---

## 📊 Dashboard Tests

### Page Load
- [ ] **Initial Load**
  - Dashboard loads without errors
  - All cards display data
  - No console errors
  - Responsive design works

### Data Cards
- [ ] **Crypto Prices Card**
  - Prices display correctly
  - Percentage changes show
  - Volume and market cap visible
  - Grid layout responsive

- [ ] **Trending Narratives Card**
  - Narratives list displays
  - No raw JSON visible
  - Expandable coin details work
  - Market insights show

- [ ] **Layer 1 Blockchains Card**
  - Blockchain data displays
  - Individual metrics show
  - Expandable details work

- [ ] **Advanced Metrics Card**
  - Stablecoin metrics display
  - Exchange flows show
  - Fear & Greed index visible
  - Market dominance metrics

- [ ] **AI Analysis Card**
  - Multi-timeframe predictions show
  - Short, medium, long-term analysis
  - Expandable sections work
  - Confidence scores display

- [ ] **Data Collection Card**
  - Last collection time shows
  - Manual collection button works
  - Collection status updates

---

## 📈 Historical Data Tests

### Page Navigation
- [ ] **Access Historical Data**
  - Click "Historical Data" in sidebar
  - Page loads without errors
  - Data type selector works

### Data Display
- [ ] **Data Types**
  - Crypto Prices: BTC, ETH, SOL, SUI, XRP
  - Market Data: Equity, DXY, Treasury, VIX, Energy
  - Fear & Greed Index
  - Trending Narratives
  - AI Analysis

### Sorting
- [ ] **Column Sorting**
  - Click timestamp column header
  - Click symbol column header
  - Click value column header
  - Click change column header
  - Click source column header
  - Sort indicators display correctly

### Export
- [ ] **Export Functionality**
  - Click export dropdown
  - Select CSV format
  - Select JSON format
  - Select Excel format
  - Files download correctly
  - No dummy data in exports

---

## 📤 Data Export Page Tests

### Admin Access
- [ ] **Admin User**
  - Navigate to "Data Export" page
  - Verify full access granted
  - All export options available
  - Export history accessible

### Export Features
- [ ] **Export Options**
  - Select data type (crypto_prices, market_data, etc.)
  - Select date range (1d, 7d, 30d, 90d, 1y, all)
  - Select format (JSON, CSV, Excel)
  - Click "Create Export"
  - File downloads with real data

---

## 🔄 Data Collection Tests

### Manual Collection
- [ ] **Trigger Collection**
  - Click "Collect Data" button
  - Verify collection starts
  - Check status updates
  - Verify data appears in dashboard

### Automated Collection
- [ ] **Cron Job**
  - Wait for scheduled collection (30 min)
  - Check server logs for collection
  - Verify new data appears
  - Check AI analysis runs

---

## 🎨 UI/UX Tests

### Responsive Design
- [ ] **Desktop (1920x1080)**
  - All cards display in grid
  - Navigation works
  - Tables display properly

- [ ] **Tablet (768x1024)**
  - Cards stack appropriately
  - Navigation adapts
  - Tables scroll horizontally

- [ ] **Mobile (375x667)**
  - Cards stack vertically
  - Navigation collapses
  - Tables scroll properly
  - Touch interactions work

### Loading States
- [ ] **Loading Indicators**
  - Dashboard loading spinner
  - Data collection progress
  - Export generation progress
  - Error state handling

---

## 🔧 Error Handling Tests

### Network Errors
- [ ] **API Failures**
  - Disconnect internet
  - Try to load dashboard
  - Check error messages
  - Reconnect and verify recovery

### Rate Limiting
- [ ] **API Rate Limits**
  - Trigger multiple data collections
  - Check rate limit handling
  - Verify retry logic
  - Check user feedback

---

## 🧪 Quick Smoke Tests

### Critical Paths
- [ ] **Login → Dashboard → Historical Data → Export**
  - Complete user journey works
  - No errors in console
  - All data displays correctly

- [ ] **Admin Full Access**
  - Admin can access all features
  - Export functionality works
  - No subscription restrictions

- [ ] **Data Freshness**
  - Data is recent (not stale)
  - Timestamps are accurate
  - Collection times update

---

## 🐛 Common Issues to Check

### Known Problems
- [ ] **Alpha Vantage Rate Limits**
  - Check for rate limit errors in console
  - Verify fallback behavior
  - Check user feedback

- [ ] **CoinGecko Rate Limits**
  - Check for 429 errors
  - Verify retry logic
  - Check caching behavior

- [ ] **Export Format Issues**
  - Excel files open in Numbers/Excel
  - CSV files have proper formatting
  - JSON files are valid

- [ ] **Admin Access Issues**
  - Admin bypass works for all endpoints
  - No 403 errors for admin users
  - Subscription checks bypassed

---

## 📝 Test Results

### Test Date: _______________
### Tester: _______________

### Pass/Fail Summary
- [ ] Authentication: ___/___ tests passed
- [ ] Dashboard: ___/___ tests passed
- [ ] Historical Data: ___/___ tests passed
- [ ] Data Export: ___/___ tests passed
- [ ] Data Collection: ___/___ tests passed
- [ ] UI/UX: ___/___ tests passed
- [ ] Error Handling: ___/___ tests passed

### Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Notes
- _________________________________
- _________________________________
- _________________________________

---

## 🚀 Next Steps

After completing manual tests:
1. Fix any issues found
2. Run automated tests: `npm test`
3. Update test documentation
4. Deploy if all tests pass

---

*Use this checklist for quick testing during development and before releases.*
