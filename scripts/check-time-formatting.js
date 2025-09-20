#!/usr/bin/env node

/**
 * Script pour vérifier que toutes les heures sont bien formatées au format hh:mm
 * partout dans l'application
 */

const fs = require('fs');
const path = require('path');

// Dossiers à analyser
const DIRECTORIES = [
  'app',
  'components',
  'utils'
];

// Extensions de fichiers à analyser
const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// Patterns à rechercher
const PATTERNS = {
  // Heure non formatée (session.time, item.time, etc.) dans un contexte d'affichage
  unformattedTime: /\{[^}]*\.time[^}]*\}/g,
  
  // Heure formatée (formatTime(session.time), etc.)
  formattedTime: /formatTime\([^)]+\)/g,
  
  // Affichage direct de l'heure
  directTimeDisplay: /\{[^}]*time[^}]*\}/g
};

// Fichiers à ignorer
const IGNORED_FILES = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'coverage'
];

function isIgnoredFile(filePath) {
  return IGNORED_FILES.some(ignored => filePath.includes(ignored));
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Ignorer les lignes de commentaires
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        return;
      }
      
      // Vérifier les heures non formatées dans un contexte d'affichage
      if (PATTERNS.unformattedTime.test(trimmedLine)) {
        // Vérifier si c'est dans un contexte d'affichage (Text, render, return)
        if (trimmedLine.includes('Text') || trimmedLine.includes('render') || trimmedLine.includes('return')) {
          // Vérifier si l'heure est déjà formatée avec formatTime()
          if (!trimmedLine.includes('formatTime(')) {
            issues.push({
              line: lineNumber,
              type: 'Heure non formatée',
              content: trimmedLine,
              suggestion: 'Utiliser formatTime() pour formater l\'heure au format hh:mm'
            });
          }
        }
      }
      
      // Compter les heures formatées (bonnes pratiques)
      if (PATTERNS.formattedTime.test(trimmedLine)) {
        issues.push({
          line: lineNumber,
          type: '✅ Heure formatée',
          content: trimmedLine,
          suggestion: 'Format correct hh:mm'
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [{
      line: 0,
      type: 'Erreur de lecture',
      content: error.message,
      suggestion: 'Vérifier les permissions du fichier'
    }];
  }
}

function scanDirectory(dirPath, results = []) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      if (isIgnoredFile(fullPath)) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, results);
      } else if (stat.isFile() && FILE_EXTENSIONS.includes(path.extname(item))) {
        const issues = analyzeFile(fullPath);
        if (issues.length > 0) {
          results.push({
            file: fullPath,
            issues
          });
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'analyse du dossier ${dirPath}:`, error.message);
  }
  
  return results;
}

function main() {
  console.log('🔍 Vérification du formatage des heures dans l\'application...\n');
  
  const results = [];
  
  // Analyser chaque dossier
  DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`📁 Analyse du dossier: ${dir}`);
      const dirResults = scanDirectory(dir);
      results.push(...dirResults);
    }
  });
  
  // Afficher les résultats
  if (results.length === 0) {
    console.log('✅ Aucun problème de formatage d\'heure détecté !');
    return;
  }
  
  console.log(`\n📊 Résultats de l'analyse (${results.length} fichiers analysés):\n`);
  
  let totalIssues = 0;
  let formattedCount = 0;
  let unformattedCount = 0;
  
  results.forEach(({ file, issues }) => {
    console.log(`📄 ${file}:`);
    
    issues.forEach(issue => {
      if (issue.type === '✅ Heure formatée') {
        formattedCount++;
        console.log(`   ✅ Ligne ${issue.line}: ${issue.content}`);
      } else if (issue.type === 'Heure non formatée') {
        unformattedCount++;
        console.log(`   ❌ Ligne ${issue.line}: ${issue.content}`);
        console.log(`      💡 Suggestion: ${issue.suggestion}`);
      } else {
        console.log(`   ⚠️  Ligne ${issue.line}: ${issue.content}`);
      }
    });
    
    totalIssues += issues.length;
    console.log('');
  });
  
  // Résumé
  console.log('📈 Résumé:');
  console.log(`   Total d'heures analysées: ${totalIssues}`);
  console.log(`   ✅ Heures bien formatées: ${formattedCount}`);
  console.log(`   ❌ Heures non formatées: ${unformattedCount}`);
  
  if (unformattedCount > 0) {
    console.log('\n🚨 Actions recommandées:');
    console.log('   1. Utiliser formatTime() pour toutes les heures affichées');
    console.log('   2. Vérifier que toutes les heures utilisent le format hh:mm');
    console.log('   3. Relancer ce script après les corrections');
  } else {
    console.log('\n🎉 Toutes les heures sont correctement formatées !');
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { analyzeFile, scanDirectory };
