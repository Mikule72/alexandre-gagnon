# Site vitrine — Alexandre Gagnon

One-pager statique HTML/CSS/JS pour Alexandre Gagnon, organisateur de séminaires & team building (Nantes / Grand Ouest).

## Aperçu

```
.
├── index.html      # Page unique, sept sections
├── styles.css      # Design system éditorial (palette bleue, fond blanc)
├── script.js       # Sticky header, reveal au scroll, soumission Supabase
└── README.md       # Ce fichier
```

Aucune dépendance build — il suffit d'ouvrir `index.html` dans un navigateur ou de déposer le dossier sur n'importe quel hébergeur statique.

## 1 — Configurer Supabase pour le formulaire

Le formulaire envoie les leads dans une table Supabase. Suivre ces étapes :

### a. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) et créer un compte.
2. Créer un nouveau projet (région la plus proche : Frankfurt ou Paris).
3. Noter l'URL du projet et la clé `anon public` dans **Project Settings → API**.

### b. Créer la table `leads`

Dans le SQL Editor du dashboard Supabase, exécuter :

```sql
create table leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  nom             text not null,
  entreprise      text not null,
  email           text not null,
  telephone       text,
  type_evenement  text not null,
  participants    int not null,
  date_envisagee  date,
  lieu            text,
  message         text not null
);

alter table leads enable row level security;

create policy "Allow public insert"
  on leads
  for insert
  to anon
  with check (true);
```

> **Note sécurité** : la policy autorise uniquement l'insertion publique (anon). La lecture reste fermée — seul l'admin (Alexandre) consulte les leads via le dashboard Supabase ou avec une clé service.

### c. Brancher le site

Ouvrir `script.js` et remplacer les deux constantes en haut du fichier :

```js
const SUPABASE_URL = 'https://xxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1...'; // clé anon public
```

> Tant que les valeurs `TODO_REMPLIR_*` ne sont pas remplacées, le formulaire affiche un message demandant la configuration et n'envoie pas réellement les données.

### d. (Optionnel) Notifications par email

Pour recevoir un email à chaque nouveau lead, créer une **Database Webhook** Supabase qui pointe vers un service tiers (Make, Zapier, n8n, ou un Edge Function Supabase qui appelle Resend / SendGrid).

## 2 — Tester en local

Ouvrir simplement `index.html` dans un navigateur (Chrome, Safari, Firefox). Pour un rendu plus fidèle (smooth fonts, fetch normalisé), servir le dossier via un petit serveur local :

```bash
# avec Python 3
python3 -m http.server 8000

# ou avec Node
npx serve .
```

Puis ouvrir `http://localhost:8000`.

## 3 — Déployer

Plusieurs options gratuites :

- **Netlify Drop** — Glisser le dossier sur [app.netlify.com/drop](https://app.netlify.com/drop). Domaine personnalisé en option.
- **Vercel** — `vercel deploy` à la racine du dossier (créer un compte gratuit).
- **GitHub Pages** — Push le dossier sur un repo `username.github.io` ou activer Pages sur n'importe quel repo.
- **OVH / o2switch / hébergeur classique** — Upload des trois fichiers via FTP dans le dossier `www/`.

### Domaine personnalisé

Tous les hébergeurs ci-dessus permettent de pointer un domaine (`alexandre-gagnon.fr` par exemple) vers le site en quelques clics.

## 4 — À fournir / personnaliser

Le site contient quelques placeholders :

| Élément | Emplacement | Action |
|---|---|---|
| Photo d'Alexandre | `index.html` — section Présentation | Remplacer le `.portrait-disc` par une `<img>` dans le même conteneur (ratio 1:1) |
| Photo hero | `index.html` — section Hero, `.figure-inner` | Remplacer le monogramme par une `<img>` (ratio 4:5) |
| LinkedIn | `index.html` — header / footer / section Contact | Remplacer les `href="#"` par l'URL LinkedIn d'Alexandre |
| Bio | `index.html` — section Présentation | Modulable, à valider/ajuster |

## 5 — Stack technique

- **HTML5** sémantique (h1/h2/h3, sections, ARIA)
- **CSS** vanilla, variables CSS, `prefers-reduced-motion` respecté
- **JavaScript** vanilla (ES6+), `IntersectionObserver` pour les reveals
- **Supabase JS** chargé via CDN (`@supabase/supabase-js@2`)
- **Google Fonts** : Fraunces, Instrument Serif, DM Sans
- Aucune étape de build, aucun framework

Lighthouse cibles : Performance ≥ 95, Accessibilité ≥ 95, Best Practices 100, SEO ≥ 95.

## 6 — Accessibilité

- Navigation clavier complète (focus visibles)
- Contrastes AA minimum (texte sombre sur fond clair, texte clair sur fond `--ink`)
- Labels explicites sur tous les champs de formulaire
- Carte SVG annotée (`<title>` + `<desc>`)
- Animations désactivées si `prefers-reduced-motion: reduce`
