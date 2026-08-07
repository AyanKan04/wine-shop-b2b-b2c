const { getPool } = require('../src/config/db');
require('dotenv').config();

async function applyConstraints() {
  try {
    const pool = await getPool();
    console.log('Connected to DB. Applying CHECK constraints...');

    const queries = [
      `IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Invoices_PaidAmount') 
       ALTER TABLE Invoices ADD CONSTRAINT CHK_Invoices_PaidAmount CHECK (PaidAmount <= Amount AND PaidAmount >= 0);`,
       
      `IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_CreditLimits_UsedAmount') 
       ALTER TABLE CreditLimits ADD CONSTRAINT CHK_CreditLimits_UsedAmount CHECK (UsedAmount <= CreditLimitAmount AND UsedAmount >= 0);`,

      `IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Inventories_Reserved') 
       ALTER TABLE Inventories ADD CONSTRAINT CHK_Inventories_Reserved CHECK (QuantityOnHand >= ReservedQuantity AND ReservedQuantity >= 0);`
    ];

    for (const q of queries) {
      await pool.request().query(q);
      console.log('Executed:', q.substring(0, 80) + '...');
    }

    console.log('All constraints applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error applying constraints:', err.message);
    process.exit(1);
  }
}

applyConstraints();
