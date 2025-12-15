# Configuration du Workflow N8N

## Problème courant

Si vous recevez l'erreur : `Format de réponse invalide : pdfContent manquant`, cela signifie que N8N ne retourne pas le format attendu.

## Structure du Workflow N8N Requise

Votre workflow N8N doit suivre cette structure :

```
1. Webhook (reçoit { productName, badge? })
   ↓
2. Node Code (construit le payload GPT)
   ↓
3. HTTP Request (appelle OpenAI/Mistral API)
   ↓
4. Parse XML (parse la réponse XML de GPT)
   ↓
5. Transform/Set (convertit en format JSON)
   ↓
6. Respond to Webhook (retourne le tableau)
```

## Format de Sortie Final (Node "Respond to Webhook")

Le dernier node de votre workflow doit retourner **exactement** ce format :

```json
[
  {
    "success": true,
    "pdfContent": {
      "titre": "...",
      "sousTitre": "...",
      "slogan": "...",
      "caracteristiques": [...],
      "consommation": [...],
      "recettes": [...]
    }
  }
]
```

## Configuration du Node "Respond to Webhook"

Dans N8N, dans votre node **"Respond to Webhook"** :

1. **Response Mode** : `Last Node`
2. **Response Data** : `Using 'Respond to Webhook' Node`
3. **Response Code** : `200`

Dans le champ **"Response Body"**, utilisez cette expression :

```json
{{ $json }}
```

OU si vous avez transformé les données dans un node précédent :

```json
[{{ $json }}]
```

## Exemple de Node "Set" pour Formater la Réponse

Si vous avez besoin de formater la réponse, utilisez un node **"Set"** avant le "Respond to Webhook" :

**Node Name** : `Format Response`

**Fields to Set** :
- **Name** : `success`
- **Value** : `true`

- **Name** : `pdfContent`
- **Value** : `{{ $json }}` (ou la structure de vos données parsées)

Puis dans le node suivant, créez un tableau :

**Node Name** : `Wrap in Array`

**Code** :
```javascript
return [{
  json: $input.first().json
}];
```

## Vérification

Pour vérifier que votre workflow retourne le bon format :

1. Testez votre webhook avec Postman ou curl :
```bash
curl -X POST https://votre-webhook-n8n.com/webhook-test/fiche_produit \
  -H "Content-Type: application/json" \
  -d '{"productName": "Salsifis noir"}'
```

2. Vérifiez que la réponse est un **tableau** `[{...}]` et non un objet `{...}`

3. Vérifiez que `pdfContent` est présent dans la réponse

## Debug

Si vous avez toujours l'erreur, vérifiez dans la console du navigateur :

1. Regardez le log `📄 Réponse brute` pour voir exactement ce que N8N retourne
2. Regardez le log `📦 Format détecté` pour voir comment le code interprète la réponse
3. Regardez le log `📥 Données finales extraites` pour voir ce qui est extrait

## Exemple de Workflow Complet

```
Webhook
  ↓
Code (construit payload GPT) → docs/n8n-code-node-gpt.js
  ↓
HTTP Request (appelle OpenAI)
  ↓
Code (parse XML) → parse la réponse XML
  ↓
Set (formate en JSON)
  - success: true
  - pdfContent: {{ données parsées }}
  ↓
Code (wrap in array)
  return [{ json: $input.first().json }];
  ↓
Respond to Webhook
```


