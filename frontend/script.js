/* eslint-disable */
const fs = require('fs');
let content = fs.readFileSync('../backend/src/models/dashboardModel.js', 'utf-8');
content = content.replace(
  /SELECT COUNT\\(DISTINCT p\.npedido\\)::int AS total\\s+FROM pedidos AS p\\s+LEFT JOIN estado AS e\\s+ON e\.nestado = p\.estado\\s+WHERE LOWER\\(COALESCE\\(e\.estado, ''\\)\\) IN \\(:pendingStates\\)\\s+AND \\\$\\{buildScopedBadgeCondition\\('p\.nbadge'\\)\\}/,
  `WITH latest AS (
            SELECT DISTINCT ON (p.nutilizador, p.nbadge)
              p.npedido,
              p.estado
            FROM pedidos AS p
            WHERE \\
            ORDER BY p.nutilizador, p.nbadge, p.npedido DESC
          )
          SELECT COUNT(l.npedido)::int AS total
          FROM latest AS l
          LEFT JOIN estado AS e
            ON e.nestado = l.estado
          WHERE LOWER(COALESCE(e.estado, '')) IN (:pendingStates)`
);
fs.writeFileSync('../backend/src/models/dashboardModel.js', content, 'utf-8');
