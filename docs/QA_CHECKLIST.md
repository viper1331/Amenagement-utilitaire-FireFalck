# Checklist QA

- [ ] `pnpm install` exécuté sans erreur.
- [ ] `pnpm lint` propre.
- [ ] `pnpm typecheck` propre.
- [ ] `pnpm test` (Vitest) vert.
- [ ] `pnpm e2e` (Playwright) vert.
- [ ] `pnpm build` réussit (web + packages + Electron).
- [ ] PWA accessible sur http://localhost:5173, projet de démonstration chargé automatiquement.
- [ ] Placement d’un module via glisser-déposer dans la scène fonctionne.
- [ ] Alertes collision/masses/couloirs se mettent à jour en temps réel.
- [ ] Raccourcis Ctrl/Cmd+Alt+↑/↓ ajustent la largeur de couloir (±50/100 mm) et affichent un toast.
- [ ] Bouton « œil » (ou Ctrl/Cmd+Alt+W) masque/affiche la bande de couloir et la préférence reste persistée.
- [ ] La surbrillance du couloir change de couleur (bleu/vert → orange → rouge) suivant les alertes présentes.
- [ ] Les overlays masses/barycentre se masquent/affichent (toolbar ou Ctrl/Cmd+Alt+M et Ctrl/Cmd+Alt+B) et sont
      persistés dans le projet.
- [ ] Le panneau « Analyse masse & essieux » reflète barycentre, charges par essieu, réserve de charge utile et liste
      les modules les plus contributeurs (clic → sélection dans la scène).
- [ ] Le rapport PDF inclut la section « Modules influents » avec au moins une entrée.
- [ ] Exports BOM.csv, BOM.json, floorplan.dxf, scene.obj, scene.gltf, report.pdf non vides.
- [ ] Sauvegarde `.fpvproj` et réimport PWA fonctionnent.
- [ ] Service worker actif (mode hors-ligne après premier chargement).
- [ ] Electron ouvre un `.fpvproj` et relaie les toasts de confirmation.
