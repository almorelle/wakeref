# Deferred Work

Issues surfaced during quick-dev reviews, deferred for later focused attention.

## from spec-most-viewed-tricks (review 2026-06-14)
- ~~**Purge des vieux buckets `figure_views`.**~~ **Abandonné (2026-06-16).** Volume négligeable (≈73k lignes/an) et la donnée historique a de la valeur analytics : top sur 1 an (`most_viewed_figures(365, …)`, déjà supporté), figures jamais consultées, saisonnalité. On garde donc tout l'historique — pas de purge. Si un jour le volume devenait gênant, purger très large (`day < current_date - interval '2 years'`) plutôt que 90 j.
- **(Optionnel) Page admin de stats vues.** Non démarré. Exposerait : top 30 j vs top 1 an + liste des figures jamais vues sur la fenêtre. Ne manque qu'un RPC `never_viewed_figures(days)` ; le top par fenêtre existe déjà.

## QW3 — Ordre par défaut des vidéos (#24)
**Clos côté technique (2026-06-16).** Le mécanisme existe déjà : colonne `videos.sort_order` + la vue `figures_full` agrège les vidéos `order by v.sort_order`. Aucun dev à faire — le reste est de la curation de contenu (remonter les rideuses via l'admin vidéos). Suivi global dans `../BACKLOG.md`.
