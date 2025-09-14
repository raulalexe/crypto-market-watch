#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests with proper setup and reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  async runTests() {
    console.log('🧪 Starting Comprehensive Test Suite...\n');
    
    try {
      // Run unit tests
      await this.runUnitTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run E2E tests (if available)
      await this.runE2ETests();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('📋 Running Unit Tests...');
    
    const testFiles = [
      'tests/unit/data-collection-optimization.test.js',
      'tests/unit/email-service-comprehensive.test.js',
      'tests/unit/api-endpoint-optimization.test.js',
      'tests/unit/alert-service.test.js',
      'tests/unit/telegram-service.test.js',
      'tests/unit/push-service.test.js'
    ];

    for (const testFile of testFiles) {
      if (fs.existsSync(testFile)) {
        await this.runTestFile(testFile, 'unit');
      }
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...');
    
    const testFiles = [
      'tests/integration/system-comprehensive.test.js'
    ];

    for (const testFile of testFiles) {
      if (fs.existsSync(testFile)) {
        await this.runTestFile(testFile, 'integration');
      }
    }
  }

  async runE2ETests() {
    console.log('🌐 Running E2E Tests...');
    
    try {
      await this.runCommand('npm', ['run', 'test:e2e'], 'e2e');
    } catch (error) {
      console.log('⚠️ E2E tests not available or failed');
    }
  }

  async runTestFile(testFile, category) {
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', ['jest', testFile, '--verbose', '--no-cache'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
        process.stderr.write(data);
      });

      jest.on('close', (code) => {
        if (code === 0) {
          this.testResults[category].passed++;
          this.testResults[category].total++;
          console.log(`✅ ${testFile} passed\n`);
        } else {
          this.testResults[category].failed++;
          this.testResults[category].total++;
          console.log(`❌ ${testFile} failed\n`);
        }
        resolve();
      });

      jest.on('error', (error) => {
        console.error(`❌ Error running ${testFile}:`, error.message);
        this.testResults[category].failed++;
        this.testResults[category].total++;
        resolve();
      });
    });
  }

  async runCommand(command, args, category) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
        process.stderr.write(data);
      });

      process.on('close', (code) => {
        if (code === 0) {
          this.testResults[category].passed++;
          this.testResults[category].total++;
          console.log(`✅ ${command} ${args.join(' ')} passed\n`);
        } else {
          this.testResults[category].failed++;
          this.testResults[category].total++;
          console.log(`❌ ${command} ${args.join(' ')} failed\n`);
        }
        resolve();
      });

      process.on('error', (error) => {
        console.error(`❌ Error running ${command}:`, error.message);
        this.testResults[category].failed++;
        this.testResults[category].total++;
        resolve();
      });
    });
  }

  generateReport() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;

    console.log('\n📊 Test Results Summary');
    console.log('========================\n');

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    Object.entries(this.testResults).forEach(([category, results]) => {
      totalPassed += results.passed;
      totalFailed += results.failed;
      totalTests += results.total;

      const status = results.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${category.toUpperCase()}: ${results.passed}/${results.total} passed`);
    });

    console.log('\n📈 Overall Results');
    console.log('==================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);

    if (totalFailed > 0) {
      console.log('\n❌ Some tests failed. Please review the output above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  }
}

// Run the tests
if (require.main === module) {
  const runner = new TestRunner();
  runner.runTests().catch(console.error);
}

module.exports = TestRunner;
