/* Mock léger de @expo/vector-icons pour les tests de components/** :
 * évite le chargement asynchrone des polices (warnings act()) et
 * expose chaque jeu d'icônes comme un élément hôte portant ses props. */
/* eslint-disable @typescript-eslint/no-require-imports */
const React = require('react');

const cache = {};
const makeIconSet = (setName) => {
  if (!cache[setName]) {
    const Comp = (props) => React.createElement(setName, props);
    Comp.displayName = setName;
    Comp.glyphMap = {};
    cache[setName] = Comp;
  }
  return cache[setName];
};

module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== 'string' || prop === 'then') return undefined;
      if (prop === 'default') return makeIconSet('Icon');
      return makeIconSet(prop);
    },
  }
);
