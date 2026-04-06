#!/usr/bin/env ts-node
/**
 * E2E Test Runner with Parallel Execution and Failure Monitoring
 *
 * Features:
 * - Test grouping by module with parallel execution
 * - Real-time failure monitoring (max 3 failures)
 * - Phased testing strategy (smoke, functional, regression)
 * - JSON report generation
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

interface TestGroup {
  name: string;
  files: string[];
  priority: number; // 1=smoke, 2=functional, 3=regression
}

interface FailedTest {
  testName: string;
  file: string;
  error: string;
  screenshot?: string;
}

interface TestResult {
  group: string;
  passed: number;
  failed: number;
  failedTests: FailedTest[];
  duration: number;
  output: string;
}

interface TestReport {
  summary: {
    totalGroups: number;
    totalPassed: number;
    totalFailed: number;
    totalDuration: number;
    startTime: string;
    endTime: string;
    testMode: string;
    maxFailures: number;
    aborted: boolean;
  };
  results: TestResult[];
}

// ============================================================================
// Configuration
// ============================================================================

const TEST_GROUPS: TestGroup[] = [
  // Phase 1: Smoke Tests (Priority 1)
  {
    name: 'login',
    files: ['login.spec.ts'],
    priority: 1,
  },
  // Phase 2: Functional Tests (Priority 2)
  {
    name: 'ci-create',
    files: ['ci-create.spec.ts'],
    priority: 2,
  },
  {
    name: 'ci-edit',
    files: ['ci-edit.spec.ts'],
    priority: 2,
  },
  {
    name: 'ci-detail',
    files: ['ci-detail.spec.ts'],
    priority: 2,
  },
  {
    name: 'ci-delete',
    files: ['ci-delete.spec.ts'],
    priority: 2,
  },
  {
    name: 'change-management',
    files: ['change-management.spec.ts'],
    priority: 2,
  },
  {
    name: 'relation-management',
    files: ['relation-management.spec.ts'],
    priority: 2,
  },
  {
    name: 'app',
    files: ['app.spec.ts'],
    priority: 2,
  },
];

// ============================================================================
// Logger
// ============================================================================

class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  static info(message: string): void {
    console.log(`[${this.getTimestamp()}] [INFO] ${message}`);
  }

  static success(message: string): void {
    console.log(`[${this.getTimestamp()}] [SUCCESS] ${message}`);
  }

  static warning(message: string): void {
    console.log(`[${this.getTimestamp()}] [WARNING] ${message}`);
  }

  static error(message: string): void {
    console.error(`[${this.getTimestamp()}] [ERROR] ${message}`);
  }

  static progress(group: string, message: string): void {
    console.log(`[${this.getTimestamp()}] [${group.toUpperCase()}] ${message}`);
  }
}

// ============================================================================
// Test Runner
// ============================================================================

class TestRunner {
  private results: Map<string, TestResult> = new Map();
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private totalFailures = 0;
  private aborted = false;
  private maxFailures: number;
  private testMode: string;
  private reportPath: string;
  private startTime: Date;

  constructor(options: { maxFailures?: number; testMode?: string; reportPath?: string }) {
    this.maxFailures = options.maxFailures ?? 3;
    this.testMode = options.testMode ?? 'mock';
    this.reportPath = options.reportPath ?? path.join(process.cwd(), 'test-report.json');
    this.startTime = new Date();
  }

  /**
   * Parse command line arguments
   */
  static parseArgs(): { maxFailures: number; testMode: string; phases: number[] } {
    const args = process.argv.slice(2);
    let maxFailures = 3;
    let testMode = process.env.TEST_MODE ?? 'mock';
    const phases: number[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--max-failures=')) {
        maxFailures = parseInt(arg.split('=')[1], 10);
      } else if (arg === '--max-failures' && args[i + 1]) {
        maxFailures = parseInt(args[i + 1], 10);
        i++;
      } else if (arg === '--full') {
        testMode = 'full';
      } else if (arg === '--mock') {
        testMode = 'mock';
      } else if (arg === '--phase1') {
        phases.push(1);
      } else if (arg === '--phase2') {
        phases.push(2);
      } else if (arg === '--phase3') {
        phases.push(3);
      } else if (arg === '--help' || arg === '-h') {
        TestRunner.printHelp();
        process.exit(0);
      }
    }

    // If TEST_MODE env var is set, it takes precedence
    if (process.env.TEST_MODE) {
      testMode = process.env.TEST_MODE;
    }

    return { maxFailures, testMode, phases: phases.length > 0 ? phases : [1, 2] };
  }

  static printHelp(): void {
    console.log(`
E2E Test Runner

Usage: ts-node test-runner.ts [options]

Options:
  --max-failures=N    Maximum number of failures before aborting (default: 3)
  --full              Run in full mode (real backend)
  --mock              Run in mock mode (default)
  --phase1            Run only smoke tests (priority 1)
  --phase2            Run only functional tests (priority 2)
  --phase3            Run regression tests (all tests)
  --help, -h          Show this help message

Environment Variables:
  TEST_MODE=mock|full  Set test mode (mock or full)

Examples:
  ts-node test-runner.ts
  ts-node test-runner.ts --max-failures=5 --full
  ts-node test-runner.ts --phase1
  TEST_MODE=full ts-node test-runner.ts
`);
  }

  /**
   * Execute a single test group
   */
  private async executeGroup(group: TestGroup): Promise<TestResult> {
    const startTime = Date.now();
    const testFiles = group.files.map(f => path.join(__dirname, f)).join(' ');

    Logger.progress(group.name, `Starting execution: ${group.files.join(', ')}`);

    return new Promise((resolve) => {
      const output: string[] = [];
      const failedTests: FailedTest[] = [];
      let passed = 0;
      let failed = 0;

      // Build Playwright command
      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = [
        'playwright',
        'test',
        ...group.files.map(f => path.join(__dirname, f)),
        '--reporter=list',
        '--workers=1',
      ];

      // Add test mode configuration
      const env = {
        ...process.env,
        TEST_MODE: this.testMode,
      };

      const child = spawn(npxCmd, args, {
        cwd: path.join(__dirname, '../..'),
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.activeProcesses.set(group.name, child);

      // Parse stdout for test results
      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output.push(text);
        this.parseTestOutput(text, group.name, failedTests);

        // Check for failure threshold
        if (this.totalFailures >= this.maxFailures && !this.aborted) {
          this.abortAll('Maximum failure threshold reached');
        }
      });

      // Parse stderr for errors
      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        output.push(text);
      });

      // Handle process completion
      child.on('close', (code) => {
        this.activeProcesses.delete(group.name);

        // Parse final results from output
        const outputText = output.join('');
        const resultMatch = outputText.match(/(\d+) passed|(\d+) failed/g);

        if (resultMatch) {
          resultMatch.forEach(match => {
            const passMatch = match.match(/(\d+) passed/);
            const failMatch = match.match(/(\d+) failed/);
            if (passMatch) passed = parseInt(passMatch[1], 10);
            if (failMatch) failed = parseInt(failMatch[1], 10);
          });
        }

        // Fallback: count from parsed failed tests
        if (failed === 0 && failedTests.length > 0) {
          failed = failedTests.length;
        }

        const duration = Date.now() - startTime;

        if (this.aborted) {
          Logger.warning(`${group.name} was aborted`);
        } else if (code === 0) {
          Logger.success(`${group.name} completed: ${passed} passed`);
        } else {
          Logger.error(`${group.name} failed: ${failed} failed, ${passed} passed`);
        }

        resolve({
          group: group.name,
          passed,
          failed,
          failedTests,
          duration,
          output: outputText,
        });
      });

      // Handle errors
      child.on('error', (error) => {
        Logger.error(`${group.name} process error: ${error.message}`);
        this.activeProcesses.delete(group.name);

        resolve({
          group: group.name,
          passed: 0,
          failed: 1,
          failedTests: [{
            testName: 'Process Error',
            file: group.files[0],
            error: error.message,
          }],
          duration: Date.now() - startTime,
          output: output.join(''),
        });
      });
    });
  }

  /**
   * Parse test output to extract failure information
   */
  private parseTestOutput(output: string, groupName: string, failedTests: FailedTest[]): void {
    const lines = output.split('\n');

    for (const line of lines) {
      // Check for failed test indicator
      if (line.includes('✘') || line.includes('✗') || line.includes('[FAIL]')) {
        // Extract test name
        const testMatch = line.match(/[✘✗]\s+(.+?)\s+\[/);
        if (testMatch) {
          const testName = testMatch[1].trim();
          const failedTest: FailedTest = {
            testName,
            file: '',
            error: line.trim(),
          };
          failedTests.push(failedTest);
          this.totalFailures++;

          Logger.error(`[${groupName}] Test failed: ${testName}`);
          Logger.error(`Total failures: ${this.totalFailures}/${this.maxFailures}`);
        }
      }

      // Check for error messages
      if (line.includes('Error:') || line.includes('expect(')) {
        const lastFailed = failedTests[failedTests.length - 1];
        if (lastFailed && !lastFailed.error.includes(line.trim())) {
          lastFailed.error += '\n' + line.trim();
        }
      }

      // Check for screenshot path
      const screenshotMatch = line.match(/screenshot:\s*(.+)/i);
      if (screenshotMatch) {
        const lastFailed = failedTests[failedTests.length - 1];
        if (lastFailed) {
          lastFailed.screenshot = screenshotMatch[1].trim();
        }
      }
    }
  }

  /**
   * Abort all running test processes
   */
  private abortAll(reason: string): void {
    if (this.aborted) return;

    this.aborted = true;
    Logger.error(`ABORTING: ${reason}`);

    this.activeProcesses.forEach((proc, procName) => {
      Logger.warning(`Terminating ${procName}...`);
      proc.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  /**
   * Run tests by phase
   */
  async run(phases: number[] = [1, 2]): Promise<TestReport> {
    Logger.info('========================================');
    Logger.info('E2E Test Runner');
    Logger.info('========================================');
    Logger.info(`Test Mode: ${this.testMode}`);
    Logger.info(`Max Failures: ${this.maxFailures}`);
    Logger.info(`Phases: ${phases.join(', ')}`);
    Logger.info('========================================');

    // Filter groups by phase
    const groupsToRun = TEST_GROUPS.filter(g => phases.includes(g.priority));

    Logger.info(`Running ${groupsToRun.length} test groups`);

    // Phase 1: Smoke tests (sequential)
    const smokeGroups = groupsToRun.filter(g => g.priority === 1);
    if (smokeGroups.length > 0) {
      Logger.info('\n--- Phase 1: Smoke Tests ---');
      for (const group of smokeGroups) {
        if (this.aborted) break;
        const result = await this.executeGroup(group);
        this.results.set(group.name, result);
      }
    }

    // Phase 2: Functional tests (parallel)
    const functionalGroups = groupsToRun.filter(g => g.priority === 2);
    if (functionalGroups.length > 0 && !this.aborted) {
      Logger.info('\n--- Phase 2: Functional Tests (Parallel) ---');
      const promises = functionalGroups.map(group =>
        this.executeGroup(group).then(result => {
          this.results.set(group.name, result);
          return result;
        })
      );

      await Promise.all(promises);
    }

    // Phase 3: Regression tests (if all passed)
    const regressionGroups = groupsToRun.filter(g => g.priority === 3);
    if (regressionGroups.length > 0 && !this.aborted) {
      const allPassed = Array.from(this.results.values()).every(r => r.failed === 0);
      if (allPassed) {
        Logger.info('\n--- Phase 3: Regression Tests ---');
        for (const group of regressionGroups) {
          if (this.aborted) break;
          const result = await this.executeGroup(group);
          this.results.set(group.name, result);
        }
      } else {
        Logger.warning('Skipping Phase 3 (Regression) - previous phases had failures');
      }
    }

    return this.generateReport();
  }

  /**
   * Generate JSON test report
   */
  private generateReport(): TestReport {
    const endTime = new Date();
    const results = Array.from(this.results.values());

    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    const report: TestReport = {
      summary: {
        totalGroups: results.length,
        totalPassed,
        totalFailed,
        totalDuration,
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        testMode: this.testMode,
        maxFailures: this.maxFailures,
        aborted: this.aborted,
      },
      results,
    };

    // Write report to file
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));

    // Print summary
    this.printSummary(report);

    return report;
  }

  /**
   * Print test summary to console
   */
  private printSummary(report: TestReport): void {
    const { summary } = report;

    Logger.info('\n========================================');
    Logger.info('TEST SUMMARY');
    Logger.info('========================================');
    Logger.info(`Total Groups: ${summary.totalGroups}`);
    Logger.info(`Total Passed: ${summary.totalPassed}`);
    Logger.info(`Total Failed: ${summary.totalFailed}`);
    Logger.info(`Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    Logger.info(`Aborted: ${summary.aborted ? 'YES' : 'NO'}`);
    Logger.info('========================================');

    // Print failed tests
    const failedResults = report.results.filter(r => r.failed > 0);
    if (failedResults.length > 0) {
      Logger.error('\nFAILED TESTS:');
      for (const result of failedResults) {
        Logger.error(`\n[${result.group}] ${result.failed} failed:`);
        for (const failed of result.failedTests) {
          Logger.error(`  - ${failed.testName}`);
          if (failed.error) {
            Logger.error(`    Error: ${failed.error.split('\n')[0]}`);
          }
        }
      }
    }

    Logger.info(`\nReport saved to: ${this.reportPath}`);

    // Exit with appropriate code
    const exitCode = summary.totalFailed > 0 || summary.aborted ? 1 : 0;
    process.exitCode = exitCode;
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = TestRunner.parseArgs();
  const runner = new TestRunner({
    maxFailures: args.maxFailures,
    testMode: args.testMode,
  });

  try {
    await runner.run(args.phases);
  } catch (error) {
    Logger.error(`Runner error: ${error}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { TestRunner, TestGroup, TestResult, FailedTest, TestReport };
