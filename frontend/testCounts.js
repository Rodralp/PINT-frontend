import { sequelize, QueryTypes } from '../backend/src/config/database.js';

async function run() {
  const accountId = 15;
  const idsRes = await sequelize.query('SELECT nutilizador, id_conta FROM utilizador WHERE nutilizador IN (SELECT DISTINCT nutilizador FROM sll_leader_sl)', {type: QueryTypes.SELECT});
  console.log(idsRes);
}
run().catch(console.error).finally(()=>process.exit());

