# Workflow N8N Complet - Génération de Fiche Produit

## Structure du Workflow

```
1. Webhook (reçoit { productName, badge? })
   ↓
2. Code - Construire Payload GPT (docs/n8n-code-node-gpt.js)
   ↓
3. HTTP Request - Appeler OpenAI/Mistral API
   ↓
4. Code - Parser la Réponse (docs/n8n-code-parse-response.js)
   ↓
5. Respond to Webhook - Retourner le résultat
```

## Configuration des Nodes

### 1. Webhook Node

**Settings**:
- **HTTP Method**: `POST`
- **Path**: `/fiche_produit` (ou votre chemin)
- **Response Mode**: `Last Node`

**Expected Payload**:
```json
{
  "productName": "Litchi",
  "badge": "circuit-court" // Optionnel
}
```

### 2. Code Node - Construire Payload GPT

**Node Name**: `Build GPT Payload`

**Code**: Copier le contenu de `docs/n8n-code-node-gpt.js`

**Output**: 
```json
{
  "payload": { ... },
  "metadata": { ... }
}
```

### 3. HTTP Request Node - Appeler OpenAI

**Node Name**: `Call OpenAI API`

**Method**: `POST`

**URL**: `https://api.openai.com/v1/chat/completions`

**Authentication**: 
- **Type**: `Header Auth`
- **Name**: `Authorization`
- **Value**: `Bearer YOUR_API_KEY`

**Body**:
```json
{{ $json.payload }}
```

**Options**:
- **Response Format**: `JSON`

### 4. Code Node - Parser la Réponse

**Node Name**: `Parse OpenAI Response`

**Code**: Copier le contenu de `docs/n8n-code-parse-response.js`

**Input**: Réponse HTTP de l'API OpenAI

**Output**: 
```json
[
  {
    "success": true,
    "pdfContent": { ... },
    "debug": { ... }
  }
]
```

### 5. Respond to Webhook Node

**Node Name**: `Return Response`

**Response Mode**: `Last Node`

**Response Data**: `Using 'Respond to Webhook' Node`

**Response Code**: `200`

**Response Body**: 
```json
{{ $json }}
```

## Exemple de Réponse Finale

```json
[
  {
    "success": true,
    "pdfContent": {
      "titre": "Litchi",
      "sousTitre": "Origine Chine, variété Hainan",
      "slogan": "Un joyau exotique aux saveurs sucrées et parfumées, évoquant l'été et l'aventure",
      "caracteristiques": [
        {
          "type": "Apparence",
          "description": "Petite boule rouge rubis, cloisonnée, recouverte d'une peau rugueuse et fragile."
        },
        {
          "type": "Goût",
          "description": "Saveur douce, florale et légèrement acidulée, avec une texture juteuse et fondante."
        },
        {
          "type": "Nutrition",
          "description": "Riche en vitamine C, il stimule l'immunité tout en étant faible en calories."
        }
      ],
      "consommation": [
        "En dessert glacé, avec une touche de menthe fraîche pour un contraste rafraîchissant",
        "En salade exotique avec mangue et citron vert, pour une explosion de saveurs",
        "Conservé au réfrigérateur, il dévoile toute sa douceur lors d'une dégustation fraîche"
      ]
    },
    "debug": {
      "xmlReceived": "<fiche>...</fiche>",
      "parsedCorrectly": true,
      "caracteristiquesCount": 3,
      "caracteristiquesWithDescription": 3,
      "consommationCount": 3
    }
  }
]
```

## Notes Importantes

1. **Format de réponse** : Le dernier node doit retourner un **tableau** `[{...}]`
2. **SousTitre** : Optionnel, sera retiré automatiquement s'il est vide
3. **Recettes** : Retirées du workflow (comme demandé)
4. **Gestion d'erreurs** : Le parser retourne `success: false` si le XML est invalide

## Test du Workflow

1. Activez le workflow dans N8N
2. Testez avec Postman ou curl :
```bash
curl -X POST https://votre-n8n.com/webhook/fiche_produit \
  -H "Content-Type: application/json" \
  -d '{"productName": "Litchi"}'
```

3. Vérifiez que la réponse est un tableau avec `pdfContent`


