#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 测试结果分析工具
function analyzeTestResults() {
  const testResultsDir = path.join(__dirname, '../../test-results');
  
  if (!fs.existsSync(testResultsDir)) {
    console.log('测试结果目录不存在');
    return;
  }
  
  console.log('开始分析测试结果...');
  
  // 读取测试结果文件
  const files = fs.readdirSync(testResultsDir);
  const testResults = [];
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(testResultsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = JSON.parse(content);
        testResults.push(result);
      } catch (error) {
        console.error(`读取测试结果文件 ${file} 失败:`, error);
      }
    }
  });
  
  if (testResults.length === 0) {
    console.log('未找到测试结果文件');
    return;
  }
  
  // 分析测试结果
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];
  
  testResults.forEach(result => {
    if (result.tests) {
      result.tests.forEach(test => {
        totalTests++;
        if (test.status === 'passed') {
          passedTests++;
        } else if (test.status === 'failed') {
          failedTests++;
          failures.push({
            test: test.title,
            file: test.file,
            error: test.error ? test.error.message : '未知错误'
          });
        }
      });
    }
  });
  
  // 生成分析报告
  console.log('\n=== 测试结果分析报告 ===');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  
  if (failures.length > 0) {
    console.log('\n=== 失败测试详情 ===');
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.test}`);
      console.log(`   文件: ${failure.file}`);
      console.log(`   错误: ${failure.error}`);
    });
    
    // 分析失败原因
    console.log('\n=== 失败原因分析 ===');
    const errorTypes = {};
    failures.forEach(failure => {
      const error = failure.error.toLowerCase();
      if (error.includes('timeout')) {
        errorTypes['超时'] = (errorTypes['超时'] || 0) + 1;
      } else if (error.includes('not visible')) {
        errorTypes['元素不可见'] = (errorTypes['元素不可见'] || 0) + 1;
      } else if (error.includes('not found')) {
        errorTypes['元素未找到'] = (errorTypes['元素未找到'] || 0) + 1;
      } else if (error.includes('api')) {
        errorTypes['API错误'] = (errorTypes['API错误'] || 0) + 1;
      } else {
        errorTypes['其他错误'] = (errorTypes['其他错误'] || 0) + 1;
      }
    });
    
    Object.entries(errorTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} (${((count / failures.length) * 100).toFixed(2)}%)`);
    });
  }
  
  console.log('\n=== 分析完成 ===');
}

// 执行分析
if (require.main === module) {
  analyzeTestResults();
}

module.exports = { analyzeTestResults };