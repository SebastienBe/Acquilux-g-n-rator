# Guide : Installer et utiliser N8N en local

## 🚀 Options d'installation

### Option 1 : N8N Desktop App (Recommandé pour débuter)

1. **Télécharger** : https://n8n.io/downloads/
2. **Installer** l'application
3. **Lancer** : N8N démarre automatiquement
4. **Accès** : http://localhost:5678

**Avantages** :
- ✅ Aucune configuration
- ✅ Interface graphique simple
- ✅ Idéal pour tester et développer

**Inconvénients** :
- ❌ Pas accessible depuis d'autres appareils
- ❌ Ressources limitées

---

### Option 2 : Via npx (Sans installation)

```bash
# Lancer N8N directement (télécharge et lance)
npx n8n

# Ou avec des options
npx n8n start --tunnel
```

**Avantages** :
- ✅ Pas besoin d'installer
- ✅ Toujours la dernière version
- ✅ Pas d'utilisation d'espace disque permanent

**Inconvénients** :
- ❌ Télécharge à chaque fois (première fois)
- ❌ Plus lent au démarrage

**Accès** : http://localhost:5678

---

### Option 3 : Via npm (Installation globale)

```bash
# Installer globalement
npm install -g n8n

# Lancer
n8n start
```

**Avantages** :
- ✅ Installation permanente
- ✅ Démarrage rapide
- ✅ Accessible depuis n'importe où dans le terminal

**Inconvénients** :
- ❌ Prend de l'espace disque
- ❌ Nécessite Node.js

**Accès** : http://localhost:5678

---

### Option 4 : Via Docker (Recommandé pour production locale)

#### Prérequis
- Docker Desktop installé : https://www.docker.com/products/docker-desktop

#### Installation

```bash
# Lancer N8N avec Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

#### Avec Docker Compose (meilleur pour la persistance)

Créez un fichier `docker-compose.yml` :

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - TZ=Europe/Paris
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

Puis lancez :

```bash
docker-compose up -d
```

**Avantages** :
- ✅ Isolation complète
- ✅ Facile à arrêter/démarrer
- ✅ Pas de pollution du système

**Inconvénients** :
- ❌ Nécessite Docker
- ❌ Plus de ressources

**Accès** : http://localhost:5678

---

## 📝 Scripts utiles

### Script de démarrage rapide (Windows)

Créez un fichier `start-n8n.bat` :

```batch
@echo off
echo Démarrage de N8N...
npx n8n
pause
```

### Script PowerShell

Créez un fichier `start-n8n.ps1` :

```powershell
Write-Host "Démarrage de N8N..." -ForegroundColor Green
npx n8n
```

---

## 🔧 Configuration

### Variables d'environnement utiles

```bash
# Désactiver l'authentification (pour développement local)
N8N_BASIC_AUTH_ACTIVE=false

# Changer le port
N8N_PORT=5678

# Changer le host
N8N_HOST=localhost

# Timezone
TZ=Europe/Paris

# Activer le tunnel (pour webhooks publics)
N8N_TUNNEL_URL=https://votre-tunnel-url.com
```

### Avec npx

```bash
npx n8n start --tunnel
```

### Avec npm

```bash
N8N_BASIC_AUTH_ACTIVE=false n8n start
```

---

## 🌐 Accéder depuis d'autres appareils

Par défaut, N8N écoute sur `localhost` (127.0.0.1), donc il n'est accessible que depuis votre machine.

### Pour rendre accessible sur le réseau local

1. **Changer le host** :
   ```bash
   N8N_HOST=0.0.0.0 npx n8n
   ```

2. **Accéder depuis un autre appareil** :
   ```
   http://VOTRE_IP_LOCALE:5678
   ```

3. **Trouver votre IP locale** :
   ```bash
   # Windows
   ipconfig
   
   # Cherchez "IPv4 Address" (ex: 192.168.1.100)
   ```

---

## 🔐 Authentification et Utilisateurs

### ⚠️ Important : Authentification obligatoire depuis n8n 1.0+

Depuis **n8n 1.0+**, l'authentification est **obligatoire** et ne peut plus être désactivée. Vous devez créer un compte administrateur au premier lancement.

### Premier lancement

1. Lancez N8N avec `.\start-n8n.ps1`
2. Accédez à http://localhost:5678
3. Créez votre compte administrateur (email + mot de passe)

### Si vous avez oublié vos identifiants

**Option 1 : Script de réinitialisation (Recommandé)**
```powershell
# Réinitialiser les utilisateurs et relancer
.\start-n8n-fresh.ps1

# Ou réinitialiser seulement
.\reset-n8n-users.ps1
```

**Option 2 : Suppression manuelle**
```powershell
# Supprimer la base de données des utilisateurs
Remove-Item -Path "$env:USERPROFILE\.n8n\database.sqlite" -Force
Remove-Item -Path "$env:USERPROFILE\.n8n\users" -Recurse -Force
```

⚠️ **Note** : Vos workflows seront préservés, seuls les utilisateurs seront supprimés.

### ⚠️ Note sur BASIC_AUTH (Déprécié)

L'authentification `BASIC_AUTH` (ancienne méthode) est **dépréciée** depuis n8n 1.0. Les variables `N8N_BASIC_AUTH_*` ne fonctionnent plus. N8N utilise maintenant un système de gestion des utilisateurs moderne.

---

## 📦 Sauvegarder vos workflows

Par défaut, N8N sauvegarde dans :
- **Windows** : `C:\Users\VOTRE_USER\.n8n`
- **Linux/Mac** : `~/.n8n`

### Exporter manuellement

1. Dans N8N : **Settings** → **Import/Export**
2. Cliquez sur **Export All Workflows**
3. Sauvegardez le fichier JSON

### Importer

1. Dans N8N : **Settings** → **Import/Export**
2. Cliquez sur **Import from File**
3. Sélectionnez votre fichier JSON

---

## 🐛 Dépannage

### Port déjà utilisé

Si le port 5678 est déjà utilisé :

```bash
# Changer le port
N8N_PORT=5679 npx n8n
```

### Erreur de permissions

```bash
# Windows : Exécuter en tant qu'administrateur
# Linux/Mac : Utiliser sudo si nécessaire
```

### Nettoyer le cache npm

```bash
npm cache clean --force
```

---

## 🚀 Commandes rapides

```bash
# Démarrer N8N (npx)
npx n8n

# Démarrer avec tunnel (pour webhooks publics)
npx n8n start --tunnel

# Démarrer sur un port différent
N8N_PORT=5679 npx n8n

# Démarrer accessible sur le réseau local
N8N_HOST=0.0.0.0 npx n8n

# Démarrer avec authentification
N8N_BASIC_AUTH_ACTIVE=true \
N8N_BASIC_AUTH_USER=admin \
N8N_BASIC_AUTH_PASSWORD=password \
npx n8n
```

---

## 📚 Ressources

- **Documentation officielle** : https://docs.n8n.io/
- **Téléchargements** : https://n8n.io/downloads/
- **Community** : https://community.n8n.io/

---

## 💡 Astuces

1. **Utilisez N8N Desktop** pour débuter rapidement
2. **Utilisez npx** si vous manquez d'espace disque
3. **Utilisez Docker** pour isoler l'installation
4. **Sauvegardez régulièrement** vos workflows
5. **Activez l'authentification** si accessible sur le réseau

