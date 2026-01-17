# Test Setup Guide

## Playwright End-to-End Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

### Configuration

1. Create a `.env.test` file in the project root (this file is gitignored):
   ```bash
   cp .env.test.example .env.test
   ```

2. Edit `.env.test` and add your test account credentials:
   ```
   TEST_EMAIL=your-test-email@example.com
   TEST_PASSWORD=your-test-password
   ```

### Running Tests

Run the triathlon flow test:
```bash
node test-triathlon-flow.js
```

### Test Account Setup

The tests require a test account in Auth0. Make sure you:
- Create a dedicated test user in your Auth0 tenant
- **Never commit credentials** - they should only exist in `.env.test` (which is gitignored)
- Use a separate test account, not your personal account

### Security Notes

⚠️ **IMPORTANT**: Never commit `.env.test` to git. It contains sensitive credentials and is automatically excluded via `.gitignore`.

If you accidentally commit credentials:
1. Change the password immediately in Auth0
2. Use `git reset --soft HEAD~1` to undo the commit (if not pushed)
3. Or use `git push --force` to rewrite remote history (if already pushed)
