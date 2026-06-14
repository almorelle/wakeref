# Deferred Work

Issues surfaced during quick-dev reviews, deferred for later focused attention.

## from spec-most-viewed-tricks (review 2026-06-14)
- **Purge des vieux buckets `figure_views`.** La table grandit indéfiniment (≈200 figures × 365 j ≈ 73k lignes/an, donc faible), mais la fenêtre ne lit que 30 j. Ajouter une purge planifiée (pg_cron) `delete from figure_views where day < current_date - 90`. Non bloquant.
