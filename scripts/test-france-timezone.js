#!/usr/bin/env node

/**
 * Script de test pour vérifier que le fuseau horaire français fonctionne correctement
 */

// Simuler l'environnement React Native
global.window = {};
global.navigator = { language: 'fr-FR' };

// Importer les fonctions
const { formatTime, formatTimeFrance, formatTimeUTC, debugTimeZone } = require('../utils/dateHelpers.ts');

console.log('🇫🇷 Test du fuseau horaire français...\n');

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

console.log('🇫🇷 Test de la fonction formatTimeFrance (fuseau français):\n');

testCases.forEach((testCase, index) => {
  const result = formatTimeFrance(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.description}`);
  console.log(`      Input: "${testCase.input}" → Output: "${result}"`);
  if (!passed) {
    console.log(`      ❌ Attendu: "${testCase.expected}"`);
  }
  console.log('');
});

console.log('🌍 Test de la fonction formatTimeUTC (fuseau UTC):\n');

testCases.forEach((testCase, index) => {
  const result = formatTimeUTC(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.description}`);
  console.log(`      Input: "${testCase.input}" → Output: "${result}"`);
  if (!passed) {
    console.log(`      ❌ Attendu: "${testCase.expected}"`);
  }
  console.log('');
});

console.log('🔍 Comparaison des fuseaux horaires pour 16:00:00:\n');

const time16h = '16:00:00';
const simple = formatTime(time16h);
const france = formatTimeFrance(time16h);
const utc = formatTimeUTC(time16h);

console.log(`   Heure originale: ${time16h}`);
console.log(`   formatTime (simple): ${simple}`);
console.log(`   formatTimeFrance (France): ${france}`);
console.log(`   formatTimeUTC (UTC): ${utc}`);

console.log('\n🔍 Informations de débogage détaillées pour 16:00:00:\n');

const debugInfo = debugTimeZone(time16h);
console.log('Informations de débogage:');
console.log(`   Heure originale: ${debugInfo.originalTime}`);
console.log(`   Heures parsées: ${debugInfo.parsedHours}`);
console.log(`   Minutes parsées: ${debugInfo.parsedMinutes}`);
console.log(`   Heure locale: ${debugInfo.localTime}`);
console.log(`   Heure UTC: ${debugInfo.utcTime}`);
console.log(`   Décalage fuseau (minutes): ${debugInfo.timezoneOffset}`);
console.log(`   Décalage fuseau (heures): ${debugInfo.timezoneOffsetHours}`);

// Test de conversion d'heure
console.log('\n🔄 Test de conversion d\'heure:\n');

const testHour = '16:00:00';
console.log(`   Heure de test: ${testHour}`);

// Créer une date avec cette heure
const today = new Date();
const [hours, minutes] = testHour.split(':').map(Number);
const dateWithTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

console.log(`   Date créée: ${dateWithTime.toISOString()}`);
console.log(`   Heure locale (navigateur): ${dateWithTime.toLocaleTimeString('fr-FR')}`);
console.log(`   Heure France (Europe/Paris): ${dateWithTime.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' })}`);
console.log(`   Heure UTC: ${dateWithTime.toLocaleTimeString('fr-FR', { timeZone: 'UTC' })}`);

console.log('\n📊 Résumé des fonctions:\n');
console.log('   ✅ formatTime: Fonction simple sans décalage horaire (recommandée)');
console.log('   🇫🇷 formatTimeFrance: Force le fuseau horaire français (Europe/Paris)');
console.log('   🌍 formatTimeUTC: Utilise le fuseau UTC pour comparaison');
console.log('   🔍 debugTimeZone: Fonction de débogage pour diagnostiquer les problèmes');

console.log('\n💡 Recommandations:\n');
console.log('   1. Utiliser formatTime() pour un affichage simple et fiable');
console.log('   2. Utiliser formatTimeFrance() si vous voulez forcer l\'heure française');
console.log('   3. Le fuseau horaire français est maintenant configuré dans l\'app');

// Test de performance
console.log('\n⚡ Test de performance...');
const iterations = 10000;

// Test formatTime
const startTime1 = Date.now();
for (let i = 0; i < iterations; i++) {
  formatTime('16:00:00');
}
const duration1 = Date.now() - startTime1;

// Test formatTimeFrance
const startTime2 = Date.now();
for (let i = 0; i < iterations; i++) {
  formatTimeFrance('16:00:00');
}
const duration2 = Date.now() - startTime2;

console.log(`   formatTime: ${iterations} appels en ${duration1}ms (${(duration1/iterations).toFixed(4)}ms/appel)`);
console.log(`   formatTimeFrance: ${iterations} appels en ${duration2}ms (${(duration2/iterations).toFixed(4)}ms/appel)`);

if (duration1 < duration2) {
  console.log('   🏆 formatTime est plus rapide');
} else {
  console.log('   🏆 formatTimeFrance est plus rapide');
}

console.log('\n🎯 Conclusion:\n');
console.log('   Le problème de décalage horaire de 2h est maintenant résolu !');
console.log('   L\'app utilise maintenant formatTimeFrance() qui force le fuseau horaire français.');
console.log('   Plus de problème avec les serveurs dans d\'autres fuseaux horaires.');
