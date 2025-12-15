# Configuration CORS pour N8N

## Problème

Erreur CORS en production :
```
Access to fetch at 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit' from origin 'null' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Causes

1. **Origine 'null'** : Se produit quand vous ouvrez le fichier HTML directement (`file://`) au lieu de le servir via un serveur HTTP
2. **N8N n'autorise pas les requêtes CORS** : Le webhook N8N n'a pas les headers CORS configurés

## Solutions

### Solution 1 : Configurer CORS sur N8N (Recommandé)

#### Option A : Configuration au niveau du Webhook Node

Dans votre workflow N8N, dans le node **Webhook** :

1. Ouvrez les **Options** du node Webhook
2. Ajoutez dans **Response Headers** :
   - **Name** : `Access-Control-Allow-Origin`
   - **Value** : `*` (pour autoriser toutes les origines) ou votre domaine spécifique

Ou ajoutez plusieurs headers :
- `Access-Control-Allow-Origin`: `*`
- `Access-Control-Allow-Methods`: `GET, POST, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type, Authorization`

#### Option B : Configuration globale N8N (Docker/Configuration)

Si vous avez accès à la configuration N8N (Docker, serveur, etc.), configurez CORS au niveau du serveur :

**Variables d'environnement N8N** :
```bash
N8N_CORS_ORIGIN=*
# ou pour un domaine spécifique :
N8N_CORS_ORIGIN=https://votre-domaine.com,file://
```

**Dans docker-compose.yml** :
```yaml
environment:
  - N8N_CORS_ORIGIN=*
```

### Solution 2 : Ajouter un node Code pour gérer CORS

Dans votre workflow N8N, ajoutez un node **Code** juste avant le "Respond to Webhook" :

**Node Name** : `Add CORS Headers`

**Code** :
```javascript
// Récupérer les données du node précédent
const data = $input.first().json;

// Ajouter les headers CORS si ce n'est pas déjà fait
// Note: Les headers doivent être ajoutés dans le node Webhook, pas ici
// Ce code est juste pour vérifier la structure

return {
  json: data
};
```

**Important** : Les headers HTTP doivent être configurés dans le node **Webhook**, pas dans un node Code.

### Solution 3 : Gérer la requête OPTIONS (Preflight)

Si N8N ne gère pas automatiquement les requêtes OPTIONS (preflight), ajoutez une condition dans votre workflow :

**Node IF** après le Webhook :
- **Condition** : `{{ $json.body.method === "OPTIONS" }}`
- **True** : Node Code qui retourne les headers CORS
- **False** : Continuer le workflow normal

**Node Code pour OPTIONS** :
```javascript
return {
  json: {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    },
    body: ''
  }
};
```

### Solution 4 : Utiliser un serveur local (Développement)

Au lieu d'ouvrir `file:///`, servez vos fichiers via un serveur HTTP :

**Option A : Python**
```bash
# Python 3
python -m http.server 8000

# Puis ouvrez http://localhost:8000/index.html
```

**Option B : Node.js (http-server)**
```bash
npx http-server -p 8000

# Puis ouvrez http://localhost:8000/index.html
```

**Option C : VS Code Live Server**
- Installez l'extension "Live Server"
- Clic droit sur `index.html` → "Open with Live Server"

Cela donnera une vraie origine (`http://localhost:8000`) au lieu de `null`.

### Solution 5 : Proxy CORS (Solution temporaire)

Si vous ne pouvez pas modifier N8N, utilisez un proxy CORS public (⚠️ **non recommandé pour la production**) :

Modifiez `js/api.js` pour utiliser un proxy :

```javascript
const CONFIG = {
  N8N_WEBHOOK_URL: 'https://cors-anywhere.herokuapp.com/https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit',
  // ...
};
```

⚠️ **Attention** : Les proxies publics peuvent être lents et peu fiables. Utilisez uniquement pour le développement.

## Configuration Recommandée pour Production

### 1. Webhook Node Configuration

Dans votre node Webhook N8N :

**Response Headers** :
- `Access-Control-Allow-Origin`: `*` (ou votre domaine)
- `Access-Control-Allow-Methods`: `POST, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type`
- `Access-Control-Max-Age`: `86400`

### 2. Gérer OPTIONS dans le workflow

Ajoutez une route pour gérer les requêtes OPTIONS (preflight) avant votre logique principale.

### 3. Utiliser un domaine spécifique (Sécurité)

Au lieu de `*`, spécifiez votre domaine :
- `Access-Control-Allow-Origin`: `https://votre-domaine.com`

## Test

Pour tester si CORS est correctement configuré :

```bash
curl -X OPTIONS https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit \
  -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Vous devriez voir les headers `Access-Control-Allow-*` dans la réponse.

## Dépannage

Si les erreurs CORS persistent :

1. Vérifiez que les headers sont bien retournés avec `curl -v`
2. Vérifiez la console du navigateur pour voir les headers exacts
3. Vérifiez que N8N n'a pas de middleware qui bloque CORS
4. Testez avec Postman pour confirmer que l'API fonctionne


