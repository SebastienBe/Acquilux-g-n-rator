# Structure du Payload N8N pour la Génération de PDF

## Format de Requête HTTP

### Endpoint
`POST {N8N_WEBHOOK_URL}`

### Headers
```
Content-Type: application/json
```

### Body (Payload)
```json
{
  "productName": "Salsifis noir",
  "badge": "circuit-court" // Optionnel
}
```

## Format de Réponse Attendue

### ⚠️ IMPORTANT : N8N doit retourner un TABLEAU
N8N doit retourner un **tableau** `[{...}]` et non un objet direct `{...}`. Le code JavaScript extrait automatiquement le premier élément.

### Structure JSON
```json
[
  {
    "success": true,
    "pdfContent": {
      "titre": "Salsifis noir",
      "sousTitre": "Français",
      "slogan": "Une racine au goût délicat",
      "caracteristiques": [
        {
          "type": "Apparence",
          "description": "Racine noire longue (30+ cm), charnue, plus moelleuse que le salsifis blanc."
        },
        {
          "type": "Goût",
          "description": "Saveur délicate sucrée, texture fondante, rappelle artichaut ou noisette."
        },
        {
          "type": "Nutrition",
          "description": "Couleur rose due au lycopène (comme le pamplemousse et la tomate), différente des oranges sanguines."
        }
      ],
      "consommation": [
        "Nature, pour apprécier pleinement sa fraîcheur",
        "En salade composée avec des herbes aromatiques",
        "Cuisiné pour révéler tous ses arômes subtils"
      ],
      "recettes": [
        {
          "type": "Sucrée",
          "nom": "Tartelettes Exotiques",
          "ingredients": "Salsifis, fruits de la passion, pâte sablée",
          "astuce": "Utiliser un zeste de fruit de la passion pour renforcer la saveur intense"
        },
        {
          "type": "Salée",
          "nom": "Salade Audacieuse",
          "ingredients": "Salsifis, orange sanguine, pamplemousse, coriandre",
          "astuce": "Ajouter un zeste d'orange pour relever la fraîcheur"
        }
      ]
    },
    "debug": {
      "xmlReceived": "...",
      "parsedCorrectly": true,
      "caracteristiquesCount": 3,
      "consommationCount": 3,
      "recettesCount": 2
    }
  }
]
```

## Champs Détaillés

### `pdfContent.titre` (string, requis)
- Titre principal du produit
- Affiché en grand, blanc, gras dans le header orange
- Exemple: "Salsifis noir"

### `pdfContent.sousTitre` (string, optionnel)
- Sous-titre du produit
- Affiché sous le titre dans le header orange
- Exemple: "Français"

### `pdfContent.slogan` (string, optionnel)
- Slogan descriptif du produit
- Peut être utilisé pour des descriptions supplémentaires

### `pdfContent.caracteristiques` (array, requis)
- Tableau d'objets avec `type` et `description`
- Minimum 1, maximum recommandé: 3-5
- Types courants: "Apparence", "Goût", "Nutrition", "Conservation"

### `pdfContent.consommation` (array, requis)
- Tableau d'objets avec `type` et `description`
- Exactement 3 éléments recommandés pour correspondre aux 3 icônes
- Types: "Dégustation Directe", "En jus", "En cuisine"

### `pdfContent.recettes` (array, optionnel)
- Tableau d'objets avec `type`, `nom`, `ingredients`, `astuce`
- Types: "Sucrée", "Salée"

## Notes pour N8N

1. **Format de réponse**: N8N doit retourner un **tableau** `[{...}]` et non un objet direct
2. **Extraction**: Le code JavaScript extrait automatiquement le premier élément du tableau
3. **Validation**: Tous les champs requis doivent être présents, sinon des valeurs par défaut seront utilisées
4. **Caractéristiques**: Doivent avoir au minimum une `description` non vide pour être valides

