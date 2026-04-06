#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 代码修改同步工具
function syncCodeChanges(pattern, oldCode, newCode) {
  console.log(`开始同步代码修改: ${pattern}`);
  console.log(`将 "${oldCode.substring(0, 50)}${oldCode.length > 50 ? '...' : ''}" 替换为 "${newCode.substring(0, 50)}${newCode.length > 50 ? '...' : ''}"`);
  
  // 查找匹配的文件
  glob(pattern, { cwd: path.join(__dirname, '../../') }, (err, files) => {
    if (err) {
      console.error('查找文件失败:', err);
      return;
    }
    
    if (files.length === 0) {
      console.log('未找到匹配的文件');
      return;
    }
    
    console.log(`找到 ${files.length} 个匹配文件:`);
    files.forEach(file => {
      console.log(`- ${file}`);
    });
    
    // 执行替换
    let modifiedCount = 0;
    files.forEach(file => {
      const filePath = path.join(__dirname, '../../', file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(oldCode)) {
          const newContent = content.replace(new RegExp(oldCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newCode);
          fs.writeFileSync(filePath, newContent, 'utf8');
          modifiedCount++;
          console.log(`✓ 修改文件: ${file}`);
        }
      } catch (error) {
        console.error(`修改文件 ${file} 失败:`, error);
      }
    });
    
    console.log(`\n=== 同步完成 ===`);
    console.log(`修改了 ${modifiedCount} 个文件`);
  });
}

// 命令行参数处理
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('用法: node code-sync.js <文件模式> <旧代码> <新代码>');
    console.log('示例: node code-sync.js "src/**/*.tsx" "oldFunction()" "newFunction()"');
    process.exit(1);
  }
  
  const [pattern, oldCode, newCode] = args;
  syncCodeChanges(pattern, oldCode, newCode);
}

module.exports = { syncCodeChanges };