# Guide utilisateur

Ce guide décrit les principales actions dans l’éditeur 3D FireFalck (PWA + Electron).

## Prise en main

1. Lancer le serveur : `pnpm --filter @app/web dev` puis ouvrir http://localhost:5173.
2. Au premier démarrage, le projet de démonstration VSAV se charge automatiquement. Sinon, cliquer sur « Charger
   démonstration » dans la barre d’outils.
3. Le panneau gauche contient le catalogue : glisser un module vers la scène pour l’ajouter. Le module apparaît au
   centre avec le gizmo de translation/rotation.
4. Sélectionner un module pour éditer ses propriétés (position mm, rotation, verrouillage, groupe, métadonnées) dans
   le panneau droit.
5. Le bandeau inférieur journalise les alertes (collisions, masses, couloirs). Cliquer sur un module dans la scène ou
   dans les alertes pour afficher les détails.

## Fonctionnalités clés

- **Undo/Redo** : Ctrl+Z / Ctrl+Shift+Z (Cmd sur macOS) ou boutons dédiés.
- **Mesure** : bouton « Mesurer » puis cliquer deux points dans la scène.
- **Snap** : sélectionner pas 25/50/100 mm et rotation 5/10/15°.
- **Couloir** : renseigner la largeur minimale (300–1600 mm) via le champ « Couloir (mm) » pour ajuster les règles de
  dégagement central. La bande au sol change de couleur (bleu/vert = OK, orange = alerte, rouge = critique) et reflète
  en temps réel la largeur suivie par les règles; elle peut aussi être ajustée au clavier via Ctrl+Alt+↑/↓ (Cmd sur
  macOS), avec un pas de 50 mm ou 100 mm lorsque Shift est enfoncé. Le bouton « œil » adjacent (ou Ctrl/Cmd+Alt+W)
  permet d’afficher ou masquer la bande, le choix étant sauvegardé dans le projet.
- **Vue FPV** : bouton « FPV » ou raccourci (voir `docs/SHORTCUTS.md`).
- **Export** : bouton « Exporter » génère en un clic BOM CSV/JSON, plan DXF, OBJ, glTF, PDF (tous textuels). Le plan
  DXF et le rapport PDF rappellent la largeur de couloir configurée et signalent les éventuelles alertes.
- **Sauvegarde locale** : `Enregistrer` télécharge un `.fpvproj`. IndexedDB sauvegarde automatiquement toutes les 60 s.
- **Import** : `Ouvrir` (sélection de fichier) ou glisser un `.fpvproj` dans la scène (PWA) / fenêtre (Electron).
- **Langues** : sélecteur FR/EN dans la barre d’outils, commutation instantanée.
- **Thème** : clair, sombre ou système.

## Mode hors-ligne

Après un premier chargement en ligne, la PWA reste accessible hors connexion. IndexedDB restaure le dernier projet
ou le projet de démonstration si aucun état n’est présent.

## Version Electron

1. Construire puis démarrer l’app (voir `docs/DEV_GUIDE.md`).
2. Les projets `.fpvproj` peuvent être ouverts via :
   - menu **Fichier > Ouvrir un projet…** ;
   - glisser-déposer dans la fenêtre ;
   - double-clic système (l’application écoute les ouvertures associées).
3. Les projets reçus apparaissent immédiatement dans la PWA embarquée et une notification toast confirme la prise en
   charge.

## Résolution de problèmes courants

- **Aucun module visible** : vérifier que le projet courant contient des placements (recharger la démo si besoin).
- **Export vide** : s’assurer que l’évaluation est terminée (attendre quelques secondes après modifications massives).
- **Service worker** : si la PWA ne se met pas à jour, vider le cache navigateur ou cliquer sur « Reload » (menu
  Electron) pour forcer le rechargement.
