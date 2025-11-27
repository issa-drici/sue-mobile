#!/usr/bin/env node

/**
 * Script de migration automatique vers le système de design
 * Remplace les patterns répétitifs par les tokens de design
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns à remplacer
const REPLACEMENTS = [
  // Couleurs
  { 
    pattern: /backgroundColor:\s*['"`]#fff['"`]/g, 
    replacement: 'backgroundColor: DesignTokens.colors.background' 
  },
  { 
    pattern: /backgroundColor:\s*['"`]#ffffff['"`]/gi, 
    replacement: 'backgroundColor: DesignTokens.colors.background' 
  },
  { 
    pattern: /backgroundColor:\s*['"`]#f5f5f5['"`]/g, 
    replacement: 'backgroundColor: DesignTokens.colors.backgroundSecondary' 
  },
  { 
    pattern: /color:\s*['"`]#666['"`]/g, 
    replacement: 'color: DesignTokens.colors.textSecondary' 
  },
  { 
    pattern: /color:\s*['"`]#999['"`]/g, 
    replacement: 'color: DesignTokens.colors.textTertiary' 
  },
  { 
    pattern: /color:\s*['"`]#000['"`]/g, 
    replacement: 'color: DesignTokens.colors.text' 
  },
  { 
    pattern: /borderColor:\s*['"`]#e0e0e0['"`]/g, 
    replacement: 'borderColor: DesignTokens.colors.border' 
  },

  // Espacements
  { 
    pattern: /padding:\s*16/g, 
    replacement: 'padding: DesignTokens.spacing.md' 
  },
  { 
    pattern: /paddingHorizontal:\s*16/g, 
    replacement: 'paddingHorizontal: DesignTokens.spacing.md' 
  },
  { 
    pattern: /paddingVertical:\s*16/g, 
    replacement: 'paddingVertical: DesignTokens.spacing.md' 
  },
  { 
    pattern: /margin:\s*16/g, 
    replacement: 'margin: DesignTokens.spacing.md' 
  },
  { 
    pattern: /marginHorizontal:\s*16/g, 
    replacement: 'marginHorizontal: DesignTokens.spacing.md' 
  },
  { 
    pattern: /marginVertical:\s*16/g, 
    replacement: 'marginVertical: DesignTokens.spacing.md' 
  },
  { 
    pattern: /padding:\s*8/g, 
    replacement: 'padding: DesignTokens.spacing.sm' 
  },
  { 
    pattern: /margin:\s*8/g, 
    replacement: 'margin: DesignTokens.spacing.sm' 
  },
  { 
    pattern: /padding:\s*24/g, 
    replacement: 'padding: DesignTokens.spacing.lg' 
  },
  { 
    pattern: /margin:\s*24/g, 
    replacement: 'margin: DesignTokens.spacing.lg' 
  },

  // Layouts flexbox
  { 
    pattern: /flexDirection:\s*['"`]row['"`],?\s*alignItems:\s*['"`]center['"`]/g, 
    replacement: '...CommonStyles.row' 
  },
  { 
    pattern: /justifyContent:\s*['"`]center['"`],?\s*alignItems:\s*['"`]center['"`]/g, 
    replacement: '...CommonStyles.centerContent' 
  },
  { 
    pattern: /flexDirection:\s*['"`]row['"`],?\s*alignItems:\s*['"`]center['"`],?\s*justifyContent:\s*['"`]space-between['"`]/g, 
    replacement: '...CommonStyles.rowBetween' 
  },

  // Typographie
  { 
    pattern: /fontSize:\s*16,?\s*fontWeight:\s*['"`]600['"`]/g, 
    replacement: '...TextStyles.bodyMedium' 
  },
  { 
    pattern: /fontSize:\s*16,?\s*fontWeight:\s*['"`]400['"`]/g, 
    replacement: '...TextStyles.body' 
  },
  { 
    pattern: /fontSize:\s*14,?\s*fontWeight:\s*['"`]400['"`]/g, 
    replacement: '...TextStyles.caption' 
  },
  { 
    pattern: /fontSize:\s*20,?\s*fontWeight:\s*['"`]600['"`]/g, 
    replacement: '...TextStyles.h3' 
  },
  { 
    pattern: /fontSize:\s*24,?\s*fontWeight:\s*['"`]bold['"`]/g, 
    replacement: '...TextStyles.h2' 
  },

  // Rayons de bordure
  { 
    pattern: /borderRadius:\s*12/g, 
    replacement: 'borderRadius: DesignTokens.borderRadius.lg' 
  },
  { 
    pattern: /borderRadius:\s*8/g, 
    replacement: 'borderRadius: DesignTokens.borderRadius.md' 
  },
  { 
    pattern: /borderRadius:\s*20/g, 
    replacement: 'borderRadius: DesignTokens.borderRadius.xxl' 
  },

  // Tailles d'icônes
  { 
    pattern: /size=\{24\}/g, 
    replacement: 'size={DesignTokens.iconSizes.lg}' 
  },
  { 
    pattern: /size=\{20\}/g, 
    replacement: 'size={DesignTokens.iconSizes.md}' 
  },
  { 
    pattern: /size=\{16\}/g, 
    replacement: 'size={DesignTokens.iconSizes.sm}' 
  },
];

// Imports à ajouter
const REQUIRED_IMPORTS = [
  "import { DesignTokens } from '../constants/DesignSystem';",
  "import { CommonStyles, TextStyles } from '../styles/CommonStyles';"
];

/**
 * Vérifie si un fichier contient déjà les imports nécessaires
 */
function hasRequiredImports(content) {
  return REQUIRED_IMPORTS.every(importStatement => 
    content.includes(importStatement.split("'")[1]) // Vérifie juste le chemin
  );
}

/**
 * Ajoute les imports nécessaires au début du fichier
 */
function addImports(content, filePath) {
  if (hasRequiredImports(content)) {
    return content;
  }

  const lines = content.split('\n');
  let insertIndex = 0;

  // Trouve la position après les derniers imports
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() === '' && insertIndex > 0) {
      // Ligne vide après les imports
      insertIndex = i;
      break;
    }
  }

  // Calcule le chemin relatif vers les constants
  const relativePath = path.relative(path.dirname(filePath), '.');
  const prefix = relativePath ? relativePath + '/' : './';

  const importsToAdd = [
    `import { DesignTokens } from '${prefix}constants/DesignSystem';`,
    `import { CommonStyles, TextStyles } from '${prefix}styles/CommonStyles';`
  ];

  // Vérifie quels imports sont déjà présents
  const existingImports = content.match(/import.*from.*['"](.*)['"]/g) || [];
  const existingPaths = existingImports.map(imp => imp.match(/['"](.*)['"]/)[1]);

  const newImports = importsToAdd.filter(imp => {
    const path = imp.match(/['"](.*)['"]/)[1];
    return !existingPaths.some(existing => existing.includes(path.split('/').pop()));
  });

  if (newImports.length === 0) {
    return content;
  }

  lines.splice(insertIndex, 0, '', ...newImports);
  return lines.join('\n');
}

/**
 * Applique les remplacements sur le contenu d'un fichier
 */
function applyReplacements(content) {
  let modifiedContent = content;
  let changesMade = false;

  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    if (pattern.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(pattern, replacement);
      changesMade = true;
    }
  });

  return { content: modifiedContent, changed: changesMade };
}

/**
 * Traite un fichier
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Ajoute les imports si nécessaire
    let modifiedContent = addImports(content, filePath);
    
    // Applique les remplacements
    const { content: finalContent, changed } = applyReplacements(modifiedContent);
    
    if (finalContent !== content) {
      fs.writeFileSync(filePath, finalContent);
      console.log(`✅ Migré: ${filePath}${changed ? ' (avec remplacements)' : ' (imports seulement)'}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Trouve tous les fichiers TypeScript/JavaScript dans le projet
 */
function findFiles() {
  const extensions = ['.tsx', '.ts', '.jsx', '.js'];
  const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'constants', 'styles'];
  
  try {
    const output = execSync('find . -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \\)', { encoding: 'utf8' });
    return output
      .split('\n')
      .filter(file => file.trim())
      .filter(file => !excludeDirs.some(dir => file.includes(`/${dir}/`) || file.startsWith(`./${dir}/`)))
      .filter(file => !file.includes('node_modules'))
      .filter(file => extensions.some(ext => file.endsWith(ext)));
  } catch (error) {
    console.error('Erreur lors de la recherche des fichiers:', error.message);
    return [];
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Début de la migration vers le système de design...\n');
  
  const files = findFiles();
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  files.forEach(file => {
    processedCount++;
    if (processFile(file)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n📊 Résumé:`);
  console.log(`   • Fichiers traités: ${processedCount}`);
  console.log(`   • Fichiers modifiés: ${modifiedCount}`);
  console.log(`   • Taux de migration: ${Math.round((modifiedCount / processedCount) * 100)}%`);
  
  if (modifiedCount > 0) {
    console.log('\n✨ Migration terminée avec succès !');
    console.log('💡 Pensez à vérifier que tout fonctionne correctement.');
  } else {
    console.log('\n✅ Aucune modification nécessaire - tous les fichiers sont déjà à jour !');
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = { processFile, applyReplacements, addImports };
