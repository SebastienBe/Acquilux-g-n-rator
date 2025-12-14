# Guide de Diagnostic - Perte des Caractéristiques en Production

## Problème
Les caractéristiques fonctionnent en test mais sont perdues en production.

## Points à vérifier

### 1. Vérifier les logs N8N en production

Dans votre workflow N8N en production, vérifiez les logs du NODE 3 (Parser) :

- Les caractéristiques sont-elles extraites correctement ?
- Les descriptions sont-elles présentes dans le JSON parsé ?
- Y a-t-il des erreurs dans les logs ?

### 2. Vérifier le format de réponse

Ouvrez la console du navigateur (F12) en production et regardez :

1. **Lors de la réception des données** :
   - `🔍 Format brut reçu de N8N` : Quel format est reçu ?
   - `📦 Format détecté` : Quel format a été détecté ?
   - `📥 Données finales extraites` : Les caractéristiques sont-elles présentes ?

2. **Lors du stockage** :
   - `🌿 Caractéristiques AVANT normalisation` : Que contient le tableau ?
   - `🌿 Caractéristiques validées` : Combien sont valides ?
   - `💾 Nombre de caractéristiques stockées` : Combien sont stockées ?

3. **Lors du chargement dans preview** :
   - `🌿 Caractéristiques dans sessionStorage` : Que contient le tableau ?
   - `🌿 Nombre de caractéristiques` : Combien sont présentes ?

### 3. Vérifier le parser N8N

Le parser N8N en production doit être identique à celui en test. Vérifiez :

- Le code du NODE 3 est-il le même ?
- La version de N8N est-elle la même ?
- Y a-t-il des différences dans la configuration ?

### 4. Données de debug

Si les caractéristiques sont perdues, les données brutes sont sauvegardées dans :
```javascript
sessionStorage.getItem('debug_raw_data')
```

Copiez ces données et vérifiez si les caractéristiques sont présentes dans la réponse brute.

## Solutions possibles

### Solution 1 : Vérifier le format de retour N8N

En production, N8N peut retourner un format différent. Le code gère déjà plusieurs formats, mais vérifiez les logs pour voir lequel est utilisé.

### Solution 2 : Vérifier le parser XML

Si vous utilisez toujours le parser XML, vérifiez que :
- Les caractères échappés sont bien nettoyés
- Les regex fonctionnent correctement
- Les descriptions sont bien extraites

### Solution 3 : Migrer vers JSON

La solution la plus fiable est de migrer vers JSON (voir `n8n-workflow-json.js`). Cela évite tous les problèmes de parsing XML.

## Actions immédiates

1. **Ouvrir la console en production** et copier tous les logs
2. **Vérifier les logs N8N** dans l'interface N8N
3. **Comparer** le format de réponse entre test et production
4. **Vérifier** que le code du NODE 3 est identique

## Logs à copier

Si le problème persiste, copiez ces logs depuis la console :

```
🔍 Format brut reçu de N8N
📦 Format détecté
📥 Données finales extraites
🌿 Caractéristiques AVANT normalisation
🌿 Caractéristiques validées
💾 Nombre de caractéristiques stockées
🌿 Caractéristiques dans sessionStorage
```

Ces logs permettront d'identifier exactement où les caractéristiques sont perdues.










