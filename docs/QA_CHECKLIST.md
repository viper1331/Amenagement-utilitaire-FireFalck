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
- [ ] Exports BOM.csv, BOM.json, floorplan.dxf, scene.obj, scene.gltf, report.pdf non vides.
- [ ] Sauvegarde `.fpvproj` et réimport PWA fonctionnent.
- [ ] Service worker actif (mode hors-ligne après premier chargement).
- [ ] Electron ouvre un `.fpvproj` et relaie les toasts de confirmation.
