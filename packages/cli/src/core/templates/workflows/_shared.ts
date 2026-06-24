export const STATE_UPDATE_TABLE = `| Performance | Criteria | Updates |
|---|---|---|
| ✅ Strong | Almost all correct (or code runs correctly, handles edge cases) | confidence +0.1~0.15 (cap 1.0), practice_count +1, last_practiced = today. If confidence > 0.7 AND practice_count ≥ 2 → mastered, else in_progress |
| 🟡 Partial | Core ideas right, some mistakes (or minor issues) | confidence +0.05 (cap 1.0), practice_count +1, last_practiced = today, status → needs_practice |
| 🔴 Weak | Mostly wrong or blank (or doesn't run / wrong direction) | confidence unchanged, practice_count unchanged, status → needs_practice |`;
