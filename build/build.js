#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

console.log('🚀 开始构建 AI Chatroom...');

async function build() {
  try {
    const srcDir = path.join(__dirname, '..', 'src');
    const distDir = path.join(__dirname, '..', 'dist');
    
    // 清理 dist 目录
    console.log('🧹 清理构建目录...');
    await fs.remove(distDir);
    await fs.ensureDir(distDir);
    
    // 复制 src 目录下的所有文件到 dist
    console.log('📁 复制源文件...');
    await fs.copy(srcDir, distDir);
    
    // 复制 package.json 和其他必要文件
    console.log('📋 复制配置文件...');
    const filesToCopy = [
      'package.json',
      'package-lock.json',
      'README.md'
    ];
    
    for (const file of filesToCopy) {
      const srcFile = path.join(__dirname, '..', file);
      const destFile = path.join(distDir, file);
      
      if (await fs.pathExists(srcFile)) {
        await fs.copy(srcFile, destFile);
        console.log(`✅ 已复制: ${file}`);
      }
    }
    
    // 创建 .nojekyll 文件（用于 GitHub Pages）
    const nojekyllFile = path.join(distDir, '.nojekyll');
    await fs.writeFile(nojekyllFile, '');
    console.log('✅ 已创建 .nojekyll 文件');
    
    console.log('🎉 构建完成！');
    console.log(`📦 构建输出目录: ${distDir}`);
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 运行构建
build();
