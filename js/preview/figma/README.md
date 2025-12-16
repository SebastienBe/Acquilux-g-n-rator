# Structure Modulaire - Figma Panel

## Modules créés

1. **figma-panel-helpers.js** - Fonctions utilitaires (getIconForType, getTitleForType, escapeHtml, rgbToHex)
2. **figma-panel-core.js** - Système de base (historique, container, ouverture/fermeture)
3. **figma-panel-creators.js** - Création des panels (title, slogan, section, list-item, recipe, main, image, default, typography, spacing)
4. **figma-panel-events.js** - Gestion des événements et application des changements
5. **figma-sections-manager.js** - Gestion des sections (masquer/afficher, modal)
6. **figma-panel.js** - Point d'entrée principal qui importe tout

## Ordre de chargement dans preview.html

1. figma-panel-helpers.js
2. figma-panel-core.js
3. figma-panel-creators.js
4. figma-panel-events.js
5. figma-sections-manager.js
6. figma-panel.js

## Dépendances

- figma-panel-core.js dépend de figma-panel-helpers.js
- figma-panel-creators.js dépend de figma-panel-helpers.js et figma-panel-core.js
- figma-panel-events.js dépend de tous les modules précédents
- figma-sections-manager.js dépend de figma-panel-core.js
- figma-panel.js dépend de tous les modules


