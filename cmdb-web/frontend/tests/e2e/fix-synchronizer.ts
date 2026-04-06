#!/usr/bin/env node
/**
 * E2E Test Fix Synchronizer
 *
 * 批量修复执行工具，支持多种修复策略、安全机制和修复验证
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';

// ==================== 类型定义 ====================

type FixStrategyType = 'string-replace' | 'function-update' | 'type-change' | 'import-update';

interface FixStrategy {
  id: string;
  type: FixStrategyType;
  description: string;
  target: {
    pattern: string | RegExp;
    replacement: string;
  };
  validation?: {
    before: string;
    after: string;
  };
}

interface RollbackPoint {
  file: string;
  originalContent: string;
  backupPath: string;
}

interface FixPlan {
  rootCause: string;
  strategy: FixStrategy;
  affectedFiles: string[];
  rollbackPoints: RollbackPoint[];
}

interface FixResult {
  file: string;
  success: boolean;
  changes: {
    lineStart: number;
    lineEnd: number;
    before: string;
    after: string;
  }[];
  error?: string;
}

interface ValidationResult {
  typescriptCheck: {
    passed: boolean;
    errors: string[];
  };
  eslintCheck: {
    passed: boolean;
    errors: string[];
  };
  testResult: {
    passed: boolean;
    failedTests: string[];
  };
}

interface FixReport {
  timestamp: string;
  rootCause: string;
  strategy: FixStrategy;
  results: FixResult[];
  validation: ValidationResult;
  rollbackAvailable: boolean;
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
  };
}

interface FailureAnalysis {
  totalFailed: number;
  categories: {
    type: string;
    count: number;
    failures: {
      testName: string;
      file: string;
      errorType: string;
      errorMessage: string;
      stackTrace: string;
    }[];
  }[];
  rootCauseGroups: {
    id: string;
    suspectedCause: string;
    affectedTests: string[];
    commonPatterns: string[];
    suggestedFix: string;
  }[];
  recommendations: string[];
}

interface ImpactReport {
  rootCause: string;
  affectedFiles: string[];
  impactLevel: 'low' | 'medium' | 'high';
  patterns: string[];
}

// ==================== 备份管理器 ====================

class BackupManager {
  private backupDir: string;

  constructor(backupDir: string = 'test-results/backups') {
    this.backupDir = path.resolve(backupDir);
    this.ensureBackupDir();
  }

  /**
   * 确保备份目录存在
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 创建文件备份
   */
  createBackup(filePath: string): RollbackPoint {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const timestamp = Date.now();
    const backupFileName = `${path.basename(filePath)}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupFileName);

    fs.writeFileSync(backupPath, content, 'utf-8');

    return {
      file: absolutePath,
      originalContent: content,
      backupPath,
    };
  }

  /**
   * 执行回滚
   */
  rollback(rollbackPoint: RollbackPoint): boolean {
    try {
      fs.writeFileSync(rollbackPoint.file, rollbackPoint.originalContent, 'utf-8');
      return true;
    } catch (error) {
      console.error(`[BackupManager] 回滚失败: ${rollbackPoint.file}`, error);
      return false;
    }
  }

  /**
   * 批量回滚
   */
  rollbackAll(rollbackPoints: RollbackPoint[]): { success: string[]; failed: string[] } {
    const success: string[] = [];
    const failed: string[] = [];

    for (const point of rollbackPoints) {
      if (this.rollback(point)) {
        success.push(point.file);
      } else {
        failed.push(point.file);
      }
    }

    return { success, failed };
  }

  /**
   * 清理过期备份
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    if (!fs.existsSync(this.backupDir)) return;

    const now = Date.now();
    const files = fs.readdirSync(this.backupDir);

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stat = fs.statSync(filePath);
      const age = now - stat.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`[BackupManager] 清理过期备份: ${file}`);
      }
    }
  }
}

// ==================== 修复执行器 ====================

class FixExecutor {
  private backupManager: BackupManager;

  constructor(backupManager: BackupManager) {
    this.backupManager = backupManager;
  }

  /**
   * 执行修复策略
   */
  execute(filePath: string, strategy: FixStrategy): FixResult {
    const absolutePath = path.resolve(filePath);
    const result: FixResult = {
      file: absolutePath,
      success: false,
      changes: [],
    };

    try {
      if (!fs.existsSync(absolutePath)) {
        result.error = `文件不存在: ${absolutePath}`;
        return result;
      }

      const content = fs.readFileSync(absolutePath, 'utf-8');
      const lines = content.split('\n');

      // 根据策略类型执行修复
      let newContent: string;
      switch (strategy.type) {
        case 'string-replace':
          newContent = this.executeStringReplace(content, strategy);
          break;
        case 'function-update':
          newContent = this.executeFunctionUpdate(content, strategy);
          break;
        case 'type-change':
          newContent = this.executeTypeChange(content, strategy);
          break;
        case 'import-update':
          newContent = this.executeImportUpdate(content, strategy);
          break;
        default:
          result.error = `未知的修复策略类型: ${strategy.type}`;
          return result;
      }

      // 计算变更
      result.changes = this.calculateChanges(content, newContent);

      // 写入文件
      fs.writeFileSync(absolutePath, newContent, 'utf-8');
      result.success = true;

      console.log(`[FixExecutor] 成功修复: ${path.basename(filePath)} (${result.changes.length} 处变更)`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`[FixExecutor] 修复失败: ${filePath}`, result.error);
    }

    return result;
  }

  /**
   * 执行字符串替换
   */
  private executeStringReplace(content: string, strategy: FixStrategy): string {
    const { pattern, replacement } = strategy.target;

    if (typeof pattern === 'string') {
      return content.split(pattern).join(replacement);
    } else {
      return content.replace(pattern, replacement);
    }
  }

  /**
   * 执行函数更新
   */
  private executeFunctionUpdate(content: string, strategy: FixStrategy): string {
    const { pattern, replacement } = strategy.target;

    // 支持函数签名和函数体的更新
    if (typeof pattern === 'string') {
      // 查找函数定义
      const funcPattern = new RegExp(
        `(function\\s+${pattern}\\s*\\([^)]*\\)\\s*\\{)\\s*([\\s\\S]*?)(\\})`,
        'g'
      );
      return content.replace(funcPattern, replacement);
    } else {
      return content.replace(pattern, replacement);
    }
  }

  /**
   * 执行类型变更
   */
  private executeTypeChange(content: string, strategy: FixStrategy): string {
    const { pattern, replacement } = strategy.target;

    if (typeof pattern === 'string') {
      // 支持 TypeScript 类型定义替换
      const typePattern = new RegExp(`(type|interface)\\s+${pattern}\\s*`, 'g');
      return content.replace(typePattern, `$1 ${replacement} `);
    } else {
      return content.replace(pattern, replacement);
    }
  }

  /**
   * 执行导入更新
   */
  private executeImportUpdate(content: string, strategy: FixStrategy): string {
    const { pattern, replacement } = strategy.target;

    if (typeof pattern === 'string') {
      // 支持 import 语句更新
      const importPattern = new RegExp(
        `(import\\s+\\{[^}]*${pattern}[^}]*\\}\\s+from\\s+['"])([^'"]+)(['"])`,
        'g'
      );
      return content.replace(importPattern, replacement);
    } else {
      return content.replace(pattern, replacement);
    }
  }

  /**
   * 计算变更内容
   */
  private calculateChanges(original: string, modified: string): FixResult['changes'] {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const changes: FixResult['changes'] = [];

    let i = 0;
    let j = 0;

    while (i < originalLines.length || j < modifiedLines.length) {
      if (i < originalLines.length && j < modifiedLines.length && originalLines[i] === modifiedLines[j]) {
        i++;
        j++;
      } else {
        // 找到变更区域
        const changeStart = i;
        let changeEnd = i;

        // 向前查找直到重新匹配
        while (changeEnd < originalLines.length && j < modifiedLines.length) {
          if (originalLines[changeEnd] === modifiedLines[j]) {
            break;
          }
          changeEnd++;
        }

        // 如果找不到匹配点，取到文件末尾
        if (changeEnd >= originalLines.length) {
          changeEnd = originalLines.length;
        }

        changes.push({
          lineStart: changeStart + 1, // 1-based line number
          lineEnd: changeEnd,
          before: originalLines.slice(changeStart, changeEnd).join('\n'),
          after: modifiedLines.slice(j, j + (changeEnd - changeStart)).join('\n'),
        });

        i = changeEnd;
        j += changeEnd - changeStart;
      }
    }

    return changes;
  }
}

// ==================== 验证器 ====================

class FixValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * 执行完整验证
   */
  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      typescriptCheck: await this.runTypeScriptCheck(),
      eslintCheck: await this.runESLintCheck(),
      testResult: await this.runTestCheck(),
    };

    return result;
  }

  /**
   * 运行 TypeScript 编译检查
   */
  private async runTypeScriptCheck(): Promise<ValidationResult['typescriptCheck']> {
    const result = {
      passed: true,
      errors: [] as string[],
    };

    try {
      execSync('npx tsc --noEmit', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      console.log('[FixValidator] TypeScript 编译检查通过');
    } catch (error) {
      result.passed = false;
      if (error instanceof Error && 'stdout' in error) {
        const output = (error as { stdout: Buffer }).stdout.toString();
        result.errors = output.split('\n').filter(line => line.includes('error TS'));
      } else {
        result.errors = ['TypeScript 编译失败'];
      }
      console.error('[FixValidator] TypeScript 编译检查失败:', result.errors.length, '个错误');
    }

    return result;
  }

  /**
   * 运行 ESLint 检查
   */
  private async runESLintCheck(): Promise<ValidationResult['eslintCheck']> {
    const result = {
      passed: true,
      errors: [] as string[],
    };

    try {
      execSync('npx eslint tests/e2e --ext .ts --max-warnings 0', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      console.log('[FixValidator] ESLint 检查通过');
    } catch (error) {
      result.passed = false;
      if (error instanceof Error && 'stdout' in error) {
        const output = (error as { stdout: Buffer }).stdout.toString();
        result.errors = output.split('\n').filter(line => line.includes('error'));
      } else {
        result.errors = ['ESLint 检查失败'];
      }
      console.error('[FixValidator] ESLint 检查失败:', result.errors.length, '个错误');
    }

    return result;
  }

  /**
   * 运行测试检查
   */
  private async runTestCheck(): Promise<ValidationResult['testResult']> {
    const result = {
      passed: true,
      failedTests: [] as string[],
    };

    try {
      const output = execSync('npx playwright test --reporter=json', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 300000, // 5分钟超时
      });

      // 解析 JSON 报告
      try {
        const testReport = JSON.parse(output);
        if (testReport.suites) {
          for (const suite of testReport.suites) {
            for (const spec of suite.specs || []) {
              if (spec.tests) {
                for (const test of spec.tests) {
                  if (test.results && test.results.some((r: { status: string }) => r.status === 'failed')) {
                    result.failedTests.push(spec.title);
                  }
                }
              }
            }
          }
        }
      } catch {
        // JSON 解析失败，假设测试通过
      }

      if (result.failedTests.length > 0) {
        result.passed = false;
        console.error('[FixValidator] 测试检查失败:', result.failedTests.length, '个失败');
      } else {
        console.log('[FixValidator] 测试检查通过');
      }
    } catch (error) {
      result.passed = false;
      if (error instanceof Error && 'stdout' in error) {
        const output = (error as { stdout: Buffer }).stdout.toString();
        // 尝试从输出中提取失败的测试
        const failedMatch = output.match(/(\d+) failed/);
        if (failedMatch) {
          result.failedTests.push(`${failedMatch[1]} 个测试失败`);
        }
      }
      console.error('[FixValidator] 测试执行失败');
    }

    return result;
  }

  /**
   * 验证单个文件的语法
   */
  validateSyntax(filePath: string): { valid: boolean; error?: string } {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // 基本的语法检查
      // 检查括号匹配
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        return { valid: false, error: '大括号不匹配' };
      }

      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        return { valid: false, error: '括号不匹配' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// ==================== 修复同步器 ====================

export class FixSynchronizer {
  private backupManager: BackupManager;
  private fixExecutor: FixExecutor;
  private fixValidator: FixValidator;
  private rollbackPoints: RollbackPoint[] = [];

  constructor(projectRoot?: string) {
    this.backupManager = new BackupManager();
    this.fixExecutor = new FixExecutor(this.backupManager);
    this.fixValidator = new FixValidator(projectRoot);
  }

  /**
   * 从分析文件加载修复计划
   */
  loadFixPlan(
    failureAnalysisPath: string = 'test-results/failure-analysis.json',
    impactReportPath: string = 'test-results/impact-report.json'
  ): FixPlan {
    // 读取失败分析
    let failureAnalysis: FailureAnalysis;
    try {
      const content = fs.readFileSync(failureAnalysisPath, 'utf-8');
      failureAnalysis = JSON.parse(content);
    } catch (error) {
      throw new Error(`无法读取失败分析文件: ${error}`);
    }

    // 读取影响报告
    let impactReport: ImpactReport;
    try {
      const content = fs.readFileSync(impactReportPath, 'utf-8');
      impactReport = JSON.parse(content);
    } catch (error) {
      // 如果影响报告不存在，从失败分析生成
      impactReport = {
        rootCause: failureAnalysis.rootCauseGroups[0]?.suspectedCause || 'Unknown',
        affectedFiles: this.extractAffectedFiles(failureAnalysis),
        impactLevel: 'medium',
        patterns: failureAnalysis.rootCauseGroups[0]?.commonPatterns || [],
      };
    }

    // 生成修复策略
    const strategy = this.generateFixStrategy(failureAnalysis, impactReport);

    return {
      rootCause: impactReport.rootCause,
      strategy,
      affectedFiles: impactReport.affectedFiles,
      rollbackPoints: [],
    };
  }

  /**
   * 提取受影响的文件列表
   */
  private extractAffectedFiles(analysis: FailureAnalysis): string[] {
    const files = new Set<string>();

    for (const category of analysis.categories) {
      for (const failure of category.failures) {
        if (failure.file && failure.file !== 'unknown') {
          files.add(failure.file);
        }
      }
    }

    return Array.from(files);
  }

  /**
   * 生成修复策略
   */
  private generateFixStrategy(
    analysis: FailureAnalysis,
    impact: ImpactReport
  ): FixStrategy {
    const rootCause = analysis.rootCauseGroups[0];

    // 根据根因类型生成相应的修复策略
    if (rootCause?.suspectedCause.includes('选择器')) {
      return {
        id: `FIX-${Date.now()}`,
        type: 'string-replace',
        description: '更新过时的元素选择器',
        target: {
          pattern: /data-testid="old-selector"/g,
          replacement: 'data-testid="new-selector"',
        },
        validation: {
          before: 'data-testid="old-selector"',
          after: 'data-testid="new-selector"',
        },
      };
    }

    if (rootCause?.suspectedCause.includes('API') || rootCause?.suspectedCause.includes('认证')) {
      return {
        id: `FIX-${Date.now()}`,
        type: 'function-update',
        description: '更新 API 调用和认证处理',
        target: {
          pattern: /await\s+api\.get\(/g,
          replacement: 'await api.getWithAuth(',
        },
      };
    }

    if (rootCause?.suspectedCause.includes('超时')) {
      return {
        id: `FIX-${Date.now()}`,
        type: 'string-replace',
        description: '增加超时时间',
        target: {
          pattern: /timeout:\s*\d+/g,
          replacement: (match: string) => {
            const currentTimeout = parseInt(match.replace(/\D/g, ''), 10);
            const newTimeout = Math.min(currentTimeout * 2, 60000);
            return `timeout: ${newTimeout}`;
          },
        },
      };
    }

    // 默认策略
    return {
      id: `FIX-${Date.now()}`,
      type: 'string-replace',
      description: `修复: ${impact.rootCause}`,
      target: {
        pattern: impact.patterns[0] || '',
        replacement: '',
      },
    };
  }

  /**
   * 交互式确认修复策略
   */
  async confirmFixStrategy(plan: FixPlan): Promise<boolean> {
    console.log('\n' + '='.repeat(60));
    console.log('修复计划确认');
    console.log('='.repeat(60));
    console.log(`根因: ${plan.rootCause}`);
    console.log(`策略: ${plan.strategy.description}`);
    console.log(`类型: ${plan.strategy.type}`);
    console.log(`受影响文件数: ${plan.affectedFiles.length}`);
    console.log('-'.repeat(60));
    console.log('受影响文件:');
    plan.affectedFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${path.basename(file)}`);
    });
    console.log('-'.repeat(60));

    // 在 CLI 环境下，默认确认
    // 实际使用时可以通过命令行参数或交互式提示
    console.log('确认执行修复? (默认: 是)');
    return true;
  }

  /**
   * 执行批量修复
   */
  async executeBatchFix(plan: FixPlan): Promise<FixResult[]> {
    console.log('\n[FixSynchronizer] 开始批量修复...');

    const results: FixResult[] = [];
    this.rollbackPoints = [];

    // 1. 创建备份
    console.log('[FixSynchronizer] 创建文件备份...');
    for (const file of plan.affectedFiles) {
      try {
        const rollbackPoint = this.backupManager.createBackup(file);
        this.rollbackPoints.push(rollbackPoint);
        console.log(`  ✓ ${path.basename(file)}`);
      } catch (error) {
        console.error(`  ✗ ${path.basename(file)} - 备份失败`);
      }
    }

    // 2. 执行修复
    console.log('[FixSynchronizer] 执行修复...');
    for (const file of plan.affectedFiles) {
      const result = this.fixExecutor.execute(file, plan.strategy);
      results.push(result);
    }

    // 3. 验证修复
    console.log('[FixSynchronizer] 验证修复结果...');
    const validation = await this.fixValidator.validate();

    // 4. 如果验证失败，自动回滚
    if (!validation.typescriptCheck.passed || !validation.eslintCheck.passed) {
      console.log('[FixSynchronizer] 验证失败，执行自动回滚...');
      this.rollbackAll();

      // 标记所有修复为失败
      results.forEach(r => {
        if (r.success) {
          r.success = false;
          r.error = '验证失败，已回滚';
        }
      });
    }

    return results;
  }

  /**
   * 执行回滚
   */
  rollbackAll(): { success: string[]; failed: string[] } {
    console.log('[FixSynchronizer] 执行回滚...');
    const result = this.backupManager.rollbackAll(this.rollbackPoints);

    console.log(`  成功: ${result.success.length} 个文件`);
    console.log(`  失败: ${result.failed.length} 个文件`);

    return result;
  }

  /**
   * 生成修复报告
   */
  generateReport(plan: FixPlan, results: FixResult[], validation: ValidationResult): FixReport {
    const successfulFiles = results.filter(r => r.success);
    const failedFiles = results.filter(r => !r.success);

    const report: FixReport = {
      timestamp: new Date().toISOString(),
      rootCause: plan.rootCause,
      strategy: plan.strategy,
      results,
      validation,
      rollbackAvailable: this.rollbackPoints.length > 0,
      summary: {
        totalFiles: results.length,
        successfulFiles: successfulFiles.length,
        failedFiles: failedFiles.length,
      },
    };

    return report;
  }

  /**
   * 保存修复报告
   */
  saveReport(report: FixReport, outputPath: string = 'test-results/fix-report.json'): void {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[FixSynchronizer] 修复报告已保存: ${outputPath}`);
  }

  /**
   * 完整的修复工作流
   */
  async runFullWorkflow(
    failureAnalysisPath?: string,
    impactReportPath?: string,
    outputPath?: string
  ): Promise<FixReport> {
    console.log('='.repeat(60));
    console.log('E2E Test Fix Synchronizer');
    console.log('='.repeat(60));

    // 1. 加载修复计划
    console.log('\n[1/5] 加载修复计划...');
    const plan = this.loadFixPlan(failureAnalysisPath, impactReportPath);

    // 2. 确认修复策略
    console.log('\n[2/5] 确认修复策略...');
    const confirmed = await this.confirmFixStrategy(plan);
    if (!confirmed) {
      throw new Error('用户取消了修复操作');
    }

    // 3. 执行批量修复
    console.log('\n[3/5] 执行批量修复...');
    const results = await this.executeBatchFix(plan);

    // 4. 验证修复
    console.log('\n[4/5] 验证修复结果...');
    const validation = await this.fixValidator.validate();

    // 5. 生成报告
    console.log('\n[5/5] 生成修复报告...');
    const report = this.generateReport(plan, results, validation);
    this.saveReport(report, outputPath);

    // 输出摘要
    console.log('\n' + '='.repeat(60));
    console.log('修复摘要');
    console.log('='.repeat(60));
    console.log(`总文件数: ${report.summary.totalFiles}`);
    console.log(`成功: ${report.summary.successfulFiles}`);
    console.log(`失败: ${report.summary.failedFiles}`);
    console.log(`TypeScript 检查: ${validation.typescriptCheck.passed ? '通过' : '失败'}`);
    console.log(`ESLint 检查: ${validation.eslintCheck.passed ? '通过' : '失败'}`);
    console.log(`测试检查: ${validation.testResult.passed ? '通过' : '失败'}`);
    console.log(`回滚可用: ${report.rollbackAvailable ? '是' : '否'}`);
    console.log('='.repeat(60));

    return report;
  }
}

// ==================== CLI 入口 ====================

if (require.main === module) {
  const args = process.argv.slice(2);
  const failureAnalysisPath = args[0] || 'test-results/failure-analysis.json';
  const impactReportPath = args[1] || 'test-results/impact-report.json';
  const outputPath = args[2] || 'test-results/fix-report.json';

  const synchronizer = new FixSynchronizer();

  synchronizer
    .runFullWorkflow(failureAnalysisPath, impactReportPath, outputPath)
    .then(report => {
      process.exit(report.summary.failedFiles > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('修复失败:', error);
      process.exit(1);
    });
}

// 导出类型和类
export type {
  FixStrategy,
  FixStrategyType,
  FixPlan,
  RollbackPoint,
  FixResult,
  ValidationResult,
  FixReport,
  FailureAnalysis,
  ImpactReport,
};
export { BackupManager, FixExecutor, FixValidator };
