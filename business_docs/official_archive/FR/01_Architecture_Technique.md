# dXb Tech Inc. - Architecture Technique & Infrastructure
**Projet:** Hasti AI (Etsyseolab-6) | **Date:** Mars 2026

## 1. Vue d'Ensemble du Système
Hasti AI est une application SaaS moderne reposant sur une architecture sans serveur (serverless), conçue pour une haute évolutivité, un traitement des données en temps réel et des analyses basées sur l'IA. 

## 2. Pile Technologique (Core Stack)
- **Frontend :** React (Vite), Tailwind CSS.
- **Backend & Cloud :** Vercel (Fonctions Serverless), Node.js.
- **Base de données & Authentification :** Supabase (PostgreSQL).
- **Passerelle de Paiement :** Stripe (Environnement de Production).
- **Moteur d'IA :** Google Gemini (gemini-3-flash-preview).

## 3. Technologie Propriétaire : "Deep Fetch" et SEO par IA
Notre propriété intellectuelle (IP) réside dans nos algorithmes de traitement. Nous structurons les données chaotiques de l'API d'Etsy grâce à :
1.  **Traitement par Lots (Batch) :** Récupération jusqu'à 200 fiches produits simultanément.
2.  **Évaluation Intelligente :** Notation de la santé des fiches (de A+ à C-) basée sur les standards SEO d'Etsy 2026.
3.  **Génération Contextuelle :** L'IA analyse des niches spécifiques (ex. Bijouterie) et génère des métadonnées adaptées aux événements (Fête des mères, Mariages) tout en respectant la limite stricte de 20 caractères par tag.

## 4. Sécurité et Conformité des Données
- **Gestion des Jetons (Tokens) :** Les jetons OAuth 2.0 d'Etsy sont synchronisés et cryptés dans Supabase.
- **Confidentialité :** Les données des utilisateurs sont isolées. Les modèles d'IA n'utilisent jamais les données des clients pour l'entraînement public.