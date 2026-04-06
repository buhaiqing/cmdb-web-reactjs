#!/usr/bin/env node
/**
 * E2E Test Failure Analyzer
 *
 * 自动收集失败证据、分类错误、识别根因模式并生成结构化报告
 */

import * as fs from 'fs';
import * as path from 'path';

// ==================== 类型定义 ====================

type ErrorCategory =
  | 'APIError'
  | 'UIError'
  | 'TimeoutError'
  | 'AssertionError'
  | 'DataError'
  | 'UnknownError';

interface AnalyzedFailure {
  testName: string;
  file: string;
  errorType: ErrorCategory;
  errorMessage: string;
  stackTrace: string;
  screenshot?: string;
  video?: string;
}

interface RootCauseGroup {
  id: string;
  suspectedCause: string;
  affectedTests: string[];
  commonPatterns: string[];
  suggestedFix: string;
}

interface FailureReport {
  totalFailed: number;
  categories: {
    type: ErrorCategory;
    count: number;
    failures: AnalyzedFailure[];
  }[];
  rootCauseGroups: RootCauseGroup[];
  recommendations: string[];
}

interface TestResultInfo {
  testName: string;
  testFile: string;
  errorMessage: string;
  stackTrace: string;
  screenshotPath?: string;
  videoPath?: string;
  errorContextPath?: string;
}

// ==================== 错误分类配置 ====================

const ERROR_PATTERNS: Record<ErrorCategory, string[]> = {
  APIError: ['api', 'request', 'response', 'network', 'fetch', 'axios', 'http', 'status', '401', '403', '404', '500', '502', '503'],
  UIError: ['locator', 'visible', 'click', 'fill', 'type', 'select', 'hover', 'focus', 'scroll', 'element', 'dom'],
  TimeoutError: ['timeout', 'waiting', 'timed out', 'exceeded', 'deadline', 'slow'],
  AssertionError: ['expect', 'assertion', 'tobe', 'tohave', 'tocontain', 'toequal', 'tomatch', 'assert', 'strictEqual'],
  DataError: ['data', 'undefined', 'null', 'cannot read', 'cannot access', 'property of', 'is not defined', 'referenceerror'],
  UnknownError: [],
};

// ==================== 文件系统工具 ====================

/**
 * 递归查找目录中的所有文件
 */
function findFiles(dir: string, pattern?: RegExp): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, pattern));
    } else if (!pattern || pattern.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 解析测试目录名称获取测试信息
 */
function parseTestDirName(dirName: string): { testName: string; browser: string } {
  // 格式: app-CMDB-端到端测试-测试名称-chromium
  const match = dirName.match(/^app-CMDB-端到端测试-(.+)-(\w+)$/);
  if (match) {
    return {
      testName: match[1].replace(/---/g, ' - ').replace(/-/g, ' '),
      browser: match[2],
    };
  }

  // 尝试其他格式
  const parts = dirName.split('-');
  const browser = parts[parts.length - 1];
  const testName = parts.slice(0, -1).join('-');

  return { testName, browser };
}

// ==================== 证据收集器 ====================

class EvidenceCollector {
  private testResultsDir: string;

  constructor(testResultsDir: string = 'test-results') {
    this.testResultsDir = path.resolve(testResultsDir);
  }

  /**
   * 收集所有失败测试的证据
   */
  collect(): TestResultInfo[] {
    if (!fs.existsSync(this.testResultsDir)) {
      console.log(`[EvidenceCollector] 测试 results 目录不存在: ${this.testResultsDir}`);
      return [];
    }

    const results: TestResultInfo[] = [];
    const entries = fs.readdirSync(this.testResultsDir);

    for (const entry of entries) {
      const fullPath = path.join(this.testResultsDir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && entry.startsWith('app-')) {
        const testInfo = this.parseTestResult(entry, fullPath);
        if (testInfo) {
          results.push(testInfo);
        }
      }
    }

    return results;
  }

  /**
   * 解析单个测试结果目录
   */
  private parseTestResult(dirName: string, dirPath: string): TestResultInfo | null {
    const { testName, browser } = parseTestDirName(dirName);

    // 查找截图
    const screenshotFiles = findFiles(dirPath, /test-failed.*\.png$/);
    const screenshotPath = screenshotFiles.length > 0 ? screenshotFiles[0] : undefined;

    // 查找视频
    const videoFiles = findFiles(dirPath, /\.webm$/);
    const videoPath = videoFiles.length > 0 ? videoFiles[0] : undefined;

    // 查找错误上下文
    const errorContextPath = path.join(dirPath, 'error-context.md');
    const hasErrorContext = fs.existsSync(errorContextPath);

    // 解析错误信息
    let errorMessage = 'Unknown error';
    let stackTrace = '';
    let testFile = 'unknown';

    if (hasErrorContext) {
      const context = this.parseErrorContext(errorContextPath);
      errorMessage = context.errorMessage;
      stackTrace = context.stackTrace;
      testFile = context.testFile;
    }

    return {
      testName,
      testFile,
      errorMessage,
      stackTrace,
      screenshotPath,
      videoPath,
      errorContextPath: hasErrorContext ? errorContextPath : undefined,
    };
  }

  /**
   * 解析错误上下文文件
   */
  private parseErrorContext(contextPath: string): {
    errorMessage: string;
    stackTrace: string;
    testFile: string;
  } {
    const content = fs.readFileSync(contextPath, 'utf-8');

    // 尝试从内容中提取错误信息
    let errorMessage = 'Unknown error';
    let stackTrace = '';
    let testFile = 'unknown';

    // 查找错误消息（通常在文件末尾或特定标记后）
    const errorMatch = content.match(/Error:\s*(.+?)(?:\n|$)/);
    if (errorMatch) {
      errorMessage = errorMatch[1].trim();
    }

    // 查找堆栈跟踪
    const stackMatch = content.match(/at\s+.+\s+\(.+:\d+:\d+\)/g);
    if (stackMatch) {
      stackTrace = stackMatch.join('\n');
    }

    // 查找测试文件信息
    const fileMatch = content.match(/file:\s*(.+?)(?:\n|$)/i) ||
                      content.match(/tests\/e2e\/[\w-]+\.spec\.ts/);
    if (fileMatch) {
      testFile = fileMatch[0];
    }

    // 如果没有找到错误信息，使用文件内容的前200字符
    if (errorMessage === 'Unknown error' && content.length > 0) {
      errorMessage = content.substring(0, 200).replace(/\n/g, ' ');
    }

    return { errorMessage, stackTrace, testFile };
  }
}

// ==================== 错误分类器 ====================

class ErrorClassifier {
  /**
   * 根据错误消息和堆栈跟踪分类错误
   */
  classify(errorMessage: string, stackTrace: string): ErrorCategory {
    const combinedText = `${errorMessage} ${stackTrace}`.toLowerCase();

    for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
      if (category === 'UnknownError') continue;

      for (const pattern of patterns) {
        if (combinedText.includes(pattern.toLowerCase())) {
          return category as ErrorCategory;
        }
      }
    }

    return 'UnknownError';
  }
}

// ==================== 根因分析器 ====================

class RootCauseAnalyzer {
  /**
   * 分析失败并识别根因模式
   */
  analyze(failures: AnalyzedFailure[]): RootCauseGroup[] {
    const groups: RootCauseGroup[] = [];

    // 1. 按错误消息聚类
    const messageClusters = this.clusterByMessage(failures);

    // 2. 按文件位置聚类
    const fileClusters = this.clusterByFile(failures);

    // 3. 按错误类型聚类
    const typeClusters = this.clusterByType(failures);

    // 合并聚类结果并生成根因组
    const allClusters = [...messageClusters, ...fileClusters, ...typeClusters];

    for (const cluster of allClusters) {
      if (cluster.failures.length >= 2) {
        const group = this.createRootCauseGroup(cluster);
        // 避免重复的根因组
        if (!groups.some(g => g.suspectedCause === group.suspectedCause)) {
          groups.push(group);
        }
      }
    }

    return groups;
  }

  /**
   * 按错误消息聚类
   */
  private clusterByMessage(failures: AnalyzedFailure[]): Array<{ key: string; failures: AnalyzedFailure[] }> {
    const clusters = new Map<string, AnalyzedFailure[]>();

    for (const failure of failures) {
      // 提取错误消息的关键部分（去除动态内容）
      const normalizedMessage = this.normalizeErrorMessage(failure.errorMessage);

      if (!clusters.has(normalizedMessage)) {
        clusters.set(normalizedMessage, []);
      }
      clusters.get(normalizedMessage)!.push(failure);
    }

    return Array.from(clusters.entries()).map(([key, failures]) => ({ key, failures }));
  }

  /**
   * 按文件位置聚类
   */
  private clusterByFile(failures: AnalyzedFailure[]): Array<{ key: string; failures: AnalyzedFailure[] }> {
    const clusters = new Map<string, AnalyzedFailure[]>();

    for (const failure of failures) {
      const file = failure.file;

      if (!clusters.has(file)) {
        clusters.set(file, []);
      }
      clusters.get(file)!.push(failure);
    }

    return Array.from(clusters.entries()).map(([key, failures]) => ({ key, failures }));
  }

  /**
   * 按错误类型聚类
   */
  private clusterByType(failures: AnalyzedFailure[]): Array<{ key: string; failures: AnalyzedFailure[] }> {
    const clusters = new Map<string, AnalyzedFailure[]>();

    for (const failure of failures) {
      const type = failure.errorType;

      if (!clusters.has(type)) {
        clusters.set(type, []);
      }
      clusters.get(type)!.push(failure);
    }

    return Array.from(clusters.entries()).map(([key, failures]) => ({ key, failures }));
  }

  /**
   * 标准化错误消息（去除动态内容）
   */
  private normalizeErrorMessage(message: string): string {
    return message
      .replace(/['"][\w-]+['"]/g, '"<value>"') // 替换字符串值
      .replace(/\d+/g, '<num>') // 替换数字
      .replace(/\s+/g, ' ') // 规范化空格
      .trim();
  }

  /**
   * 创建根因组
   */
  private createRootCauseGroup(cluster: { key: string; failures: AnalyzedFailure[] }): RootCauseGroup {
    const failures = cluster.failures;
    const firstFailure = failures[0];

    // 识别共同模式
    const commonPatterns = this.identifyCommonPatterns(failures);

    // 推断可能的原因
    const suspectedCause = this.inferSuspectedCause(firstFailure, commonPatterns);

    // 生成修复建议
    const suggestedFix = this.generateSuggestedFix(firstFailure.errorType, suspectedCause);

    return {
      id: `RCG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      suspectedCause,
      affectedTests: failures.map(f => f.testName),
      commonPatterns,
      suggestedFix,
    };
  }

  /**
   * 识别共同模式
   */
  private identifyCommonPatterns(failures: AnalyzedFailure[]): string[] {
    const patterns: string[] = [];

    // 检查是否都是同一类型
    const types = new Set(failures.map(f => f.errorType));
    if (types.size === 1) {
      patterns.push(`所有失败都是 ${failures[0].errorType} 类型`);
    }

    // 检查是否涉及相同文件
    const files = new Set(failures.map(f => f.file));
    if (files.size === 1) {
      patterns.push(`都发生在文件: ${failures[0].file}`);
    }

    // 检查错误消息相似度
    const messages = failures.map(f => f.errorMessage);
    const commonKeywords = this.findCommonKeywords(messages);
    if (commonKeywords.length > 0) {
      patterns.push(`共同关键词: ${commonKeywords.join(', ')}`);
    }

    return patterns;
  }

  /**
   * 查找共同关键词
   */
  private findCommonKeywords(messages: string[]): string[] {
    if (messages.length === 0) return [];

    const words = messages[0].toLowerCase().split(/\s+/);
    const commonWords: string[] = [];

    for (const word of words) {
      if (word.length > 3 && messages.every(m => m.toLowerCase().includes(word))) {
        commonWords.push(word);
      }
    }

    return commonWords.slice(0, 5); // 最多返回5个
  }

  /**
   * 推断可能的原因
   */
  private inferSuspectedCause(failure: AnalyzedFailure, patterns: string[]): string {
    switch (failure.errorType) {
      case 'APIError':
        if (failure.errorMessage.includes('401') || failure.errorMessage.includes('403')) {
          return '认证或授权问题 - 可能是会话过期或权限不足';
        }
        if (failure.errorMessage.includes('500') || failure.errorMessage.includes('502') || failure.errorMessage.includes('503')) {
          return '服务器端错误 - 后端服务可能不可用或存在bug';
        }
        if (failure.errorMessage.includes('network') || failure.errorMessage.includes('fetch')) {
          return '网络连接问题 - 可能是网络不稳定或API端点配置错误';
        }
        return 'API调用失败 - 可能是请求参数错误或服务端异常';

      case 'UIError':
        if (failure.errorMessage.includes('locator') || failure.errorMessage.includes('visible')) {
          return 'UI元素定位失败 - 可能是选择器变更或元素未渲染';
        }
        if (failure.errorMessage.includes('click') || failure.errorMessage.includes('fill')) {
          return 'UI交互失败 - 可能是元素被遮挡或不可交互';
        }
        return 'UI操作失败 - 可能是页面状态不符合预期';

      case 'TimeoutError':
        if (failure.errorMessage.includes('navigation')) {
          return '页面导航超时 - 可能是网络慢或页面加载问题';
        }
        if (failure.errorMessage.includes('locator')) {
          return '元素等待超时 - 可能是元素未出现或选择器错误';
        }
        return '操作超时 - 可能是系统响应慢或资源不足';

      case 'AssertionError':
        return '断言失败 - 实际结果与预期不符';

      case 'DataError':
        if (failure.errorMessage.includes('undefined') || failure.errorMessage.includes('null')) {
          return '数据未定义或为空 - 可能是API返回数据不完整';
        }
        return '数据错误 - 可能是数据格式或内容问题';

      default:
        return '未知原因 - 需要进一步调查';
    }
  }

  /**
   * 生成修复建议
   */
  private generateSuggestedFix(errorType: ErrorCategory, suspectedCause: string): string {
    switch (errorType) {
      case 'APIError':
        return '检查API端点配置、认证令牌有效性、请求参数正确性；查看后端日志定位具体错误';

      case 'UIError':
        return '更新元素选择器、添加等待条件确保元素可交互、检查页面渲染状态';

      case 'TimeoutError':
        return '增加超时时间、优化页面加载性能、添加等待条件或重试机制';

      case 'AssertionError':
        return '检查测试预期值是否正确、验证业务逻辑变更、更新断言条件';

      case 'DataError':
        return '检查API响应数据结构、添加数据验证和空值处理、更新测试数据';

      default:
        return '查看详细错误日志和截图，手动复现问题以确定根因';
    }
  }
}

// ==================== 报告生成器 ====================

class ReportGenerator {
  /**
   * 生成失败分析报告
   */
  generate(failures: AnalyzedFailure[], rootCauseGroups: RootCauseGroup[]): FailureReport {
    // 按类型分类
    const categories = this.categorizeFailures(failures);

    // 生成建议
    const recommendations = this.generateRecommendations(failures, rootCauseGroups);

    return {
      totalFailed: failures.length,
      categories,
      rootCauseGroups,
      recommendations,
    };
  }

  /**
   * 按类型分类失败
   */
  private categorizeFailures(failures: AnalyzedFailure[]): FailureReport['categories'] {
    const grouped = new Map<ErrorCategory, AnalyzedFailure[]>();

    for (const failure of failures) {
      if (!grouped.has(failure.errorType)) {
        grouped.set(failure.errorType, []);
      }
      grouped.get(failure.errorType)!.push(failure);
    }

    return Array.from(grouped.entries()).map(([type, failures]) => ({
      type,
      count: failures.length,
      failures,
    }));
  }

  /**
   * 生成修复建议
   */
  private generateRecommendations(failures: AnalyzedFailure[], groups: RootCauseGroup[]): string[] {
    const recommendations: string[] = [];

    // 基于错误类型的建议
    const typeCounts = new Map<ErrorCategory, number>();
    for (const failure of failures) {
      typeCounts.set(failure.errorType, (typeCounts.get(failure.errorType) || 0) + 1);
    }

    // 找出最常见的错误类型
    const mostCommonType = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (mostCommonType) {
      const [type, count] = mostCommonType;
      recommendations.push(`优先处理 ${type} (${count} 个失败) - 这是最常见的错误类型`);

      switch (type) {
        case 'APIError':
          recommendations.push('检查后端服务健康状态和网络连接');
          recommendations.push('验证API认证机制和令牌有效性');
          break;
        case 'UIError':
          recommendations.push('更新页面元素选择器以匹配最新UI');
          recommendations.push('添加显式等待确保元素可交互');
          break;
        case 'TimeoutError':
          recommendations.push('优化测试执行环境性能');
          recommendations.push('调整超时配置以适应实际响应时间');
          break;
        case 'AssertionError':
          recommendations.push('审查测试用例的预期值是否与业务需求一致');
          recommendations.push('检查是否有未通知的业务逻辑变更');
          break;
        case 'DataError':
          recommendations.push('检查测试数据的有效性和完整性');
          recommendations.push('在代码中添加数据验证和空值处理');
          break;
      }
    }

    // 基于根因组的建议
    if (groups.length > 0) {
      recommendations.push(`发现 ${groups.length} 个根因模式 - 修复一个可能解决多个失败`);

      for (const group of groups.slice(0, 3)) {
        recommendations.push(`[根因组 ${group.id}] ${group.suspectedCause}`);
      }
    }

    // 通用建议
    if (failures.length > 5) {
      recommendations.push('失败数量较多，建议分批处理，优先修复影响面广的问题');
    }

    recommendations.push('查看 test-results/ 目录中的截图和错误上下文获取详细信息');

    return recommendations;
  }

  /**
   * 保存报告到文件
   */
  saveReport(report: FailureReport, outputPath: string): void {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }
}

// ==================== 主分析器 ====================

export class FailureAnalyzer {
  private evidenceCollector: EvidenceCollector;
  private errorClassifier: ErrorClassifier;
  private rootCauseAnalyzer: RootCauseAnalyzer;
  private reportGenerator: ReportGenerator;

  constructor(testResultsDir?: string) {
    this.evidenceCollector = new EvidenceCollector(testResultsDir);
    this.errorClassifier = new ErrorClassifier();
    this.rootCauseAnalyzer = new RootCauseAnalyzer();
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * 执行完整的失败分析流程
   */
  analyze(): FailureReport {
    console.log('[FailureAnalyzer] 开始收集失败证据...');

    // 1. 收集证据
    const testResults = this.evidenceCollector.collect();

    if (testResults.length === 0) {
      console.log('[FailureAnalyzer] 未发现失败的测试');
      return {
        totalFailed: 0,
        categories: [],
        rootCauseGroups: [],
        recommendations: ['未发现失败的测试'],
      };
    }

    console.log(`[FailureAnalyzer] 发现 ${testResults.length} 个失败的测试`);

    // 2. 分类错误
    const analyzedFailures: AnalyzedFailure[] = testResults.map(result => ({
      testName: result.testName,
      file: result.testFile,
      errorType: this.errorClassifier.classify(result.errorMessage, result.stackTrace),
      errorMessage: result.errorMessage,
      stackTrace: result.stackTrace,
      screenshot: result.screenshotPath,
      video: result.videoPath,
    }));

    // 3. 分析根因
    const rootCauseGroups = this.rootCauseAnalyzer.analyze(analyzedFailures);

    // 4. 生成报告
    const report = this.reportGenerator.generate(analyzedFailures, rootCauseGroups);

    return report;
  }

  /**
   * 分析并保存报告
   */
  analyzeAndSave(outputPath: string = 'test-results/failure-analysis.json'): FailureReport {
    const report = this.analyze();
    this.reportGenerator.saveReport(report, outputPath);
    console.log(`[FailureAnalyzer] 分析报告已保存到: ${outputPath}`);
    return report;
  }
}

// ==================== CLI 入口 ====================

if (require.main === module) {
  const testResultsDir = process.argv[2] || 'test-results';
  const outputPath = process.argv[3] || 'test-results/failure-analysis.json';

  console.log('='.repeat(60));
  console.log('E2E Test Failure Analyzer');
  console.log('='.repeat(60));
  console.log(`测试 Results 目录: ${testResultsDir}`);
  console.log(`输出报告路径: ${outputPath}`);
  console.log('-'.repeat(60));

  const analyzer = new FailureAnalyzer(testResultsDir);
  const report = analyzer.analyzeAndSave(outputPath);

  console.log('-'.repeat(60));
  console.log('分析摘要:');
  console.log(`  总失败数: ${report.totalFailed}`);
  console.log(`  错误分类:`);
  for (const category of report.categories) {
    console.log(`    - ${category.type}: ${category.count}`);
  }
  console.log(`  根因模式: ${report.rootCauseGroups.length} 个`);
  console.log('-'.repeat(60));
  console.log('修复建议:');
  for (const rec of report.recommendations) {
    console.log(`  - ${rec}`);
  }
  console.log('='.repeat(60));
}

// 导出类型和类
export { ErrorCategory, AnalyzedFailure, RootCauseGroup, FailureReport };
export { EvidenceCollector, ErrorClassifier, RootCauseAnalyzer, ReportGenerator };
