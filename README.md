# 📬 Doppler Webmail

Une application web minimaliste pour consulter ses mails Gmail via OAuth2 et l’API Gmail.

---

## 🚀 Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/JeanDev/doppler-webmail.git
cd doppler-webmail
```


### 2. Installer les dépendances
#### Backend (Express)
```bash
cd server
npm install
```

#### Frontend (React + Vite)
```bash
cd ../client
npm install
```

### 3. Créer le fichier .env
Dans le dossier server, crée un fichier .env :

```env
CLIENT_ID=xxx.apps.googleusercontent.com
CLIENT_SECRET=xxx
REDIRECT_URI=http://localhost:5173
```

### 4. Lancer l’application
#### Depuis la racine du projet :

```bash
npm install
npm run dev
```
Cela démarre le frontend et le backend en parallèle grâce à concurrently.

## 🔐 Authentification OAuth2
L’app utilise OAuth2 pour se connecter à Gmail

Tu dois créer un projet Google Cloud et des identifiants OAuth2

Ajoute ton compte Gmail comme utilisateur testeur dans l’écran d’autorisation

## 🧪 Fonctionnalités
Connexion sécurisée via Google

Affichage des mails Gmail (sujet uniquement)

Architecture React + Express

Proxy configuré pour éviter les problèmes CORS
