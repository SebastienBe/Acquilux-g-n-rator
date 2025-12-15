# Résolution des Erreurs N8N

## Erreur : `pdfContent manquant`

### Symptôme

Vous recevez cette erreur :
```
❌ pdfContent manquant dans les données: {success: true, message: 'success'}
```

### Cause

Le workflow N8N retourne `{"success": true, "message": "success"}` au lieu du format attendu avec `pdfContent`.

### Solutions

#### 1. Vérifier que le node "Parse Response" retourne bien le bon format

Dans votre node Code "Parse OpenAI Response", assurez-vous que le code retourne bien :

```javascript
return {
  json: [response]  // ⚠️ IMPORTANT : Retourner un TABLEAU
};
```

Et non :
```javascript
return {
  json: response  // ❌ MAUVAIS : Retourne un objet, pas un tableau
};
```

#### 2. Vérifier la configuration du node "Respond to Webhook"

Dans votre dernier node "Respond to Webhook" :

**Response Mode** : `Last Node`

**Response Data** : `Using 'Respond to Webhook' Node`

**Response Code** : `200`

**Response Body** : 
```json
{{ $json }}
```

⚠️ **IMPORTANT** : Si vous utilisez plusieurs nodes Code, vérifiez que le dernier node avant "Respond to Webhook" retourne bien un tableau.

#### 3. Vérifier la chaîne complète du workflow

Assurez-vous que votre workflow suit cette structure :

```
Webhook
  ↓
Code (Build GPT Payload)
  ↓
HTTP Request (Call OpenAI)
  ↓
Code (Parse Response) ← Vérifier ici que le retour est un tableau
  ↓
Respond to Webhook
```

#### 4. Vérifier que le node "Parse Response" reçoit bien les données

Ajoutez un console.log temporaire dans votre node "Parse Response" :

```javascript
// Au début du node
console.log('Input reçu:', JSON.stringify($input.first().json, null, 2));
```

Puis vérifiez dans les logs N8N que vous recevez bien la réponse de l'API OpenAI.

#### 5. Solution de contournement : Ajouter un node "Set" avant "Respond to Webhook"

Si votre node "Parse Response" retourne déjà un tableau mais que "Respond to Webhook" ne le reçoit pas :

1. Ajoutez un node **"Set"** entre "Parse Response" et "Respond to Webhook"
2. **Node Name** : `Wrap Response`
3. Configurez-le ainsi :

**Fields to Set** :
- **Name** : `response`
- **Value** : `{{ $json }}` (ou `{{ $json[0] }}` selon votre structure)

Puis ajoutez un node **Code** :

```javascript
const response = $input.first().json.response;

// Si c'est déjà un tableau, le retourner tel quel
if (Array.isArray(response)) {
  return { json: response };
}

// Sinon, l'envelopper dans un tableau
return {
  json: [response]
};
```

#### 6. Vérifier que le format de réponse est correct

Le format attendu par l'application est :

```json
[
  {
    "success": true,
    "pdfContent": {
      "titre": "...",
      "sousTitre": "...",
      "slogan": "...",
      "caracteristiques": [...],
      "consommation": [...]
    },
    "debug": {...}
  }
]
```

### Checklist de débogage

- [ ] Le node "Parse Response" retourne `{ json: [response] }` (tableau)
- [ ] Le node "Respond to Webhook" utilise `{{ $json }}` comme Response Body
- [ ] Le node "Respond to Webhook" a "Response Mode" = "Last Node"
- [ ] Les logs N8N montrent que le node "Parse Response" reçoit bien la réponse OpenAI
- [ ] Les logs N8N montrent que le node "Parse Response" retourne bien un tableau
- [ ] Le workflow est activé dans N8N

### Test rapide

Pour tester rapidement, vous pouvez ajouter un node "Code" juste avant "Respond to Webhook" avec :

```javascript
// Test : Forcer le format attendu
return {
  json: [{
    success: true,
    pdfContent: {
      titre: "Test",
      slogan: "Test slogan",
      caracteristiques: [
        { type: "Apparence", description: "Test description" }
      ],
      consommation: ["Test consommation"]
    }
  }]
};
```

Si cela fonctionne, le problème vient du node "Parse Response". Sinon, le problème vient de "Respond to Webhook".


