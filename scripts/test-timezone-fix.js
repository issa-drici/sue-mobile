#!/usr/bin/env node

/**
 * Script de test pour vérifier que le problème de décalage horaire est résolu
 */

// Simuler l'environnement React Native
global.window = {};
global.navigator = { language: 'fr-FR' };

// Importer les fonctions
const { formatTime, formatTimeLocal, debugTimeZone } = require('../utils/dateHelpers.ts');

console.log('🌍 Test de la correction du décalage horaire...\n');

// Cas de test avec des heures problématiques
const testCases = [
  { input: '16:00:00', expected: '16:00', description: '16h00 avec secondes' },
  { input: '14:30:00', expected: '14:30', description: '14h30 avec secondes' },
  { input: '09:15:45', expected: '09:15', description: '09h15 avec secondes' },
  { input: '23:45:12', expected: '23:45', description: '23h45 avec secondes' },
  { input: '00:00:00', expected: '00:00', description: 'Minuit avec secondes' },
  { input: '12:00:00', expected: '12:00', description: 'Midi avec secondes' }
];

console.log('📋 Test de la fonction formatTime (simple):\n');

testCases.forEach((testCase, index) => {
  const result = formatTime(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.description}`);
  console.log(`      Input: "${testCase.input}" → Output: "${result}"`);
  if (!passed) {
    console.log(`      ❌ Attendu: "${testCase.expected}"`);
  }
  console.log('');
});

console.log('🌍 Test de la fonction formatTimeLocal (avec fuseau horaire):\n');

testCases.forEach((testCase, index) => {
  const result = formatTimeLocal(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.description}`);
  console.log(`      Input: "${testCase.input}" → Output: "${result}"`);
  if (!passed) {
    console.log(`      ❌ Attendu: "${testCase.expected}"`);
  }
  console.log('');
});

console.log('🔍 Test de débogage du fuseau horaire pour 16:00:00:\n');

const debugInfo = debugTimeZone('16:00:00');
console.log('Informations de débogage:');
console.log(`   Heure originale: ${debugInfo.originalTime}`);
console.log(`   Heures parsées: ${debugInfo.parsedHours}`);
console.log(`   Minutes parsées: ${debugInfo.parsedMinutes}`);
console.log(`   Heure locale: ${debugInfo.localTime}`);
console.log(`   Heure UTC: ${debugInfo.utcTime}`);
console.log(`   Décalage fuseau (minutes): ${debugInfo.timezoneOffset}`);
console.log(`   Décalage fuseau (heures): ${debugInfo.timezoneOffsetHours}`);

console.log('\n📊 Résumé:');
console.log('   ✅ formatTime: Fonction simple sans décalage horaire');
console.log('   🌍 formatTimeLocal: Fonction avec gestion du fuseau horaire');
console.log('   🔍 debugTimeZone: Fonction de débogage pour diagnostiquer les problèmes');

console.log('\n💡 Recommandations:');
console.log('   1. Utiliser formatTime() pour un affichage simple et fiable');
console.log('   2. Utiliser formatTimeLocal() si des problèmes de fuseau persistent');
console.log('   3. Utiliser debugTimeZone() pour diagnostiquer les problèmes');

// Test de performance
console.log('\n⚡ Test de performance...');
const iterations = 10000;

// Test formatTime
const startTime1 = Date.now();
for (let i = 0; i < iterations; i++) {
  formatTime('16:00:00');
}
const duration1 = Date.now() - startTime1;

// Test formatTimeLocal
const startTime2 = Date.now();
for (let i = 0; i < iterations; i++) {
  formatTimeLocal('16:00:00');
}
const duration2 = Date.now() - startTime2;

console.log(`   formatTime: ${iterations} appels en ${duration1}ms (${(duration1/iterations).toFixed(4)}ms/appel)`);
console.log(`   formatTimeLocal: ${iterations} appels en ${duration2}ms (${(duration2/iterations).toFixed(4)}ms/appel)`);

if (duration1 < duration2) {
  console.log('   🏆 formatTime est plus rapide');
} else {
  console.log('   🏆 formatTimeLocal est plus rapide');
}
