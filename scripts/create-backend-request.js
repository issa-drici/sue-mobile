#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createBackendRequest() {

  // 1. Type de demande

  const typeChoice = await question('Choisissez le type de demande (1-4): ');
  
  let type, templateFile, folder;
  switch(typeChoice) {
    case '1':
      type = 'feature-request';
      templateFile = 'feature-request.md';
      folder = 'features';
      break;
    case '2':
      type = 'bug-report';
      templateFile = 'bug-report.md';
      folder = 'bugs';
      break;
    case '3':
      type = 'api-improvement';
      templateFile = 'api-improvement.md';
      folder = 'improvements';
      break;
    case '4':
      type = 'breaking-change';
      templateFile = 'breaking-change.md';
      folder = 'breaking-changes';
      break;
    default:
      rl.close();
      return;
  }

  // 2. Informations de base
  const title = await question('Titre de la demande: ');
  const priority = await question('Priorité (CRITICAL/HIGH/MEDIUM/LOW): ');
  const deadline = await question('Deadline (YYYY-MM-DD): ');

  // 3. Générer l'ID
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const id = `${type.toUpperCase().substring(0, 2)}-${today}-001`;

  // 4. Lire le template
  const templatePath = path.join(__dirname, '../backend-requests/templates', templateFile);
  if (!fs.existsSync(templatePath)) {
    rl.close();
    return;
  }

  let content = fs.readFileSync(templatePath, 'utf8');

  // 5. Remplacer les placeholders
  content = content
    .replace(/\[Titre de la fonctionnalité\]/g, title)
    .replace(/\[Titre du bug\]/g, title)
    .replace(/\[Titre de l'amélioration\]/g, title)
    .replace(/\[Titre du changement\]/g, title)
    .replace(/\[YYYYMMDD\]/g, today)
    .replace(/\[001\]/g, '001')
    .replace(/\[Date de création\]/g, new Date().toISOString().slice(0, 10))
    .replace(/\[Date de découverte\]/g, new Date().toISOString().slice(0, 10))
    .replace(/\[Date de proposition\]/g, new Date().toISOString().slice(0, 10))
    .replace(/\[Nom du développeur mobile\]/g, 'Équipe Mobile')
    .replace(/\[Nom du développeur\]/g, 'Équipe Mobile')
    .replace(/\[Nom du développeur backend\]/g, 'Équipe Backend')
    .replace(/🔴 CRITICAL \| 🟡 HIGH \| 🟢 MEDIUM \| 🔵 LOW/g, priority)
    .replace(/\[Date limite souhaitée\]/g, deadline);

  // 6. Créer le dossier si nécessaire
  const folderPath = path.join(__dirname, '../backend-requests', folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // 7. Générer le nom de fichier
  const filename = `${id}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
  const filePath = path.join(folderPath, filename);

  // 8. Écrire le fichier
  fs.writeFileSync(filePath, content);



  rl.close();
}

