#!/usr/bin/env node

/**
 * Script de test pour vérifier que le formatage des heures fonctionne correctement
 */

// Simuler l'environnement React Native
global.window = {};
global.navigator = { language: 'fr-FR' };

// Importer la fonction formatTime
const { formatTime } = require('../utils/dateHelpers.ts');

console.log('🧪 Test du formatage des heures...\n');

// Cas de test
const testCases = [
  { input: '14:30:00', expected: '14:30', description: 'Heure avec secondes' },
  { input: '09:15:45', expected: '09:15', description: 'Heure du matin avec secondes' },
  { input: '23:45:12', expected: '23:45', description: 'Heure du soir avec secondes' },
  { input: '00:00:00', expected: '00:00', description: 'Minuit avec secondes' },
  { input: '12:00:00', expected: '12:00', description: 'Midi avec secondes' },
  { input: '14:30', expected: '14:30', description: 'Heure sans secondes' },
  { input: '09:15', expected: '09:15', description: 'Heure du matin sans secondes' },
  { input: '23:45', expected: '23:45', description: 'Heure du soir sans secondes' }
];

let passedTests = 0;
let totalTests = testCases.length;

console.log('📋 Cas de test :\n');

testCases.forEach((testCase, index) => {
  try {
    const result = formatTime(testCase.input);
    const passed = result === testCase.expected;
    
    if (passed) {
      passedTests++;
      console.log(`   ✅ Test ${index + 1}: ${testCase.description}`);
      console.log(`      Input: "${testCase.input}" → Output: "${result}"`);
    } else {
      console.log(`   ❌ Test ${index + 1}: ${testCase.description}`);
      console.log(`      Input: "${testCase.input}" → Output: "${result}" (attendu: "${testCase.expected}")`);
    }
  } catch (error) {
    console.log(`   💥 Test ${index + 1}: ${testCase.description}`);
    console.log(`      Erreur: ${error.message}`);
  }
  
  console.log('');
});

// Résumé
console.log('📊 Résumé des tests :');
console.log(`   Tests réussis: ${passedTests}/${totalTests}`);
console.log(`   Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 Tous les tests sont passés ! Le formatage des heures fonctionne parfaitement.');
} else {
  console.log('\n⚠️  Certains tests ont échoué. Vérifiez l\'implémentation de formatTime().');
}

// Test de performance
console.log('\n⚡ Test de performance...');
const iterations = 10000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  formatTime('14:30:00');
}

const endTime = Date.now();
const duration = endTime - startTime;
const avgTime = duration / iterations;

console.log(`   ${iterations} appels en ${duration}ms`);
console.log(`   Temps moyen par appel: ${avgTime.toFixed(4)}ms`);
console.log(`   Performance: ${Math.round(iterations / duration)} appels/ms`);

if (avgTime < 1) {
  console.log('   ✅ Performance excellente !');
} else if (avgTime < 5) {
  console.log('   ✅ Performance correcte');
} else {
  console.log('   ⚠️  Performance à surveiller');
}
