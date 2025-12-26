# Réinitialiser les utilisateurs N8N

## Problème

Vous êtes bloqué car N8N vous demande des identifiants que vous n'avez jamais créés, ou vous avez oublié vos identifiants.

## Solution : Réinitialiser les utilisateurs

### Méthode 1 : Utiliser le script PowerShell (Recommandé)

1. **Arrêtez N8N** (Ctrl+C dans le terminal où il tourne)

2. **Exécutez le script de réinitialisation** :
   ```powershell
   .\reset-n8n-users.ps1
   ```

3. **Suivez les instructions** du script

4. **Relancez N8N** :
   ```powershell
   .\start-n8n.ps1
   ```

5. **Accédez à** http://localhost:5678 et **créez un nouveau compte admin**

### Méthode 2 : Suppression manuelle

Si le script ne fonctionne pas, vous pouvez supprimer manuellement :

1. **Arrêtez N8N** (Ctrl+C)

2. **Ouvrez PowerShell** et exécutez :
   ```powershell
   # Chemin du dossier N8N
   $n8nPath = "$env:USERPROFILE\.n8n"
   
   # Supprimer la base de données (contient les utilisateurs)
   Remove-Item -Path "$n8nPath\database.sqlite" -Force -ErrorAction SilentlyContinue
   
   # Supprimer le dossier users (si existe)
   Remove-Item -Path "$n8nPath\users" -Recurse -Force -ErrorAction SilentlyContinue
   ```

3. **Relancez N8N** et créez un nouveau compte

## ⚠️ Important

- **Les workflows sont préservés** (ils sont dans `workflows/`)
- Seuls les **utilisateurs** et la **base de données** sont supprimés
- Vous devrez **recréer un compte admin** au prochain lancement

## Pourquoi N8N demande-t-il une authentification ?

Depuis **n8n 1.0+**, l'authentification est **obligatoire** et ne peut plus être désactivée pour des raisons de sécurité. 

Même en développement local, vous devez créer un compte admin au premier lancement.

Si un utilisateur existe déjà (par exemple d'un précédent lancement), N8N demande toujours de s'authentifier.

## Astuce : Utiliser un gestionnaire de mots de passe

Pour éviter d'oublier vos identifiants, utilisez un gestionnaire de mots de passe :
- Bitwarden
- 1Password
- LastPass
- etc.

Ou notez-les dans un endroit sûr (jamais dans le code source !).

