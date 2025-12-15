# Exemple de Code N8N pour GPT-4.1-nano

## Code JavaScript pour Node Code N8N

Utilisez ce code dans un **Node Code** de N8N, puis connectez-le à un **Node HTTP Request** qui appelle l'API OpenAI/Mistral.

Voir le fichier : `docs/n8n-code-node-gpt.js`

## Ancien format (Node GPT direct)

Si vous utilisez directement un Node GPT dans N8N, voici le prompt :

```
Tu es un expert en rédaction de fiches produits pour un marché de produits frais.

Génère une fiche produit au format XML pour le produit suivant : {{$json.productName}}

Format XML requis :
<fiche>
  <titre>Nom du produit</titre>
  <sousTitre>Origine ou variété (optionnel)</sousTitre>
  <slogan>Une description poétique et appétissante en une phrase</slogan>
  <caracteristiques>
    <caracteristique type="Apparence">Description visuelle du produit</caracteristique>
    <caracteristique type="Goût">Description des saveurs</caracteristique>
    <caracteristique type="Nutrition">Bienfaits nutritionnels ou particularités</caracteristique>
  </caracteristiques>
  <consommation>
    <suggestion>Première façon de consommer</suggestion>
    <suggestion>Deuxième façon de consommer</suggestion>
    <suggestion>Troisième façon de consommer</suggestion>
  </consommation>
  <recettes>
    <recette type="Sucrée">
      <nom>Nom de la recette sucrée</nom>
      <ingredients>Liste des ingrédients principaux</ingredients>
      <astuce>Astuce pour réussir la recette</astuce>
    </recette>
    <recette type="Salée">
      <nom>Nom de la recette salée</nom>
      <ingredients>Liste des ingrédients principaux</ingredients>
      <astuce>Astuce pour réussir la recette</astuce>
    </recette>
  </recettes>
</fiche>

Instructions :
- Le titre doit être accrocheur et mettre en valeur le produit
- Le sousTitre est optionnel (origine, variété, appellation)
- Le slogan doit être poétique, appétissant, en une phrase
- Les caractéristiques doivent être précises et appétissantes
- Les suggestions de consommation doivent être variées et pratiques
- Les recettes doivent être originales et réalisables
- Utilise un ton chaleureux et gourmand
- Adapte le contenu au produit demandé
```

## Exemple de réponse GPT attendue

```
<fiche>
  <titre>Salsifis noir</titre>
  <sousTitre>Français</sousTitre>
  <slogan>Une racine au goût délicat, alliant douceur et caractère</slogan>
  <caracteristiques>
    <caracteristique type="Apparence">Racine noire longue (30+ cm), charnue, plus moelleuse que le salsifis blanc.</caracteristique>
    <caracteristique type="Goût">Saveur délicate sucrée, texture fondante, rappelle artichaut ou noisette.</caracteristique>
    <caracteristique type="Nutrition">Couleur rose due au lycopène (comme le pamplemousse et la tomate), différente des oranges sanguines.</caracteristique>
  </caracteristiques>
  <consommation>
    <suggestion>Nature, pour apprécier pleinement sa fraîcheur</suggestion>
    <suggestion>En salade composée avec des herbes aromatiques</suggestion>
    <suggestion>Cuisiné pour révéler tous ses arômes subtils</suggestion>
  </consommation>
  <recettes>
    <recette type="Sucrée">
      <nom>Tartelettes Exotiques à l'Avocat et Fruits de la Passion</nom>
      <ingredients>Avocat, fruits de la passion, pâte sablée</ingredients>
      <astuce>Utiliser un zeste de fruit de la passion pour renforcer la saveur intense</astuce>
    </recette>
    <recette type="Salée">
      <nom>Salade Audacieuse d'Avocat et Agrumes</nom>
      <ingredients>Avocat, orange sanguine, pamplemousse, coriandre</ingredients>
      <astuce>Ajouter un zeste d'orange pour relever la fraîcheur et parfumer subtilement</astuce>
    </recette>
  </recettes>
</fiche>
```

## Structure du Workflow N8N

1. **Webhook** : Reçoit `{ productName, badge? }`
2. **GPT Node** : Utilise le prompt ci-dessus avec `{{$json.productName}}`
3. **Parse XML** : Parse la réponse XML de GPT
4. **Transform** : Convertit en format JSON attendu
5. **Return** : Retourne le tableau `[{ success: true, pdfContent: {...} }]`

## Format de sortie N8N

Le dernier node doit retourner :
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

**⚠️ IMPORTANT** : N8N doit retourner un **tableau** `[{...}]` et non un objet direct `{...}`.

