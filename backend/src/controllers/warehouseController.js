const { dbMock } = require('../config/db');

const getInventory = (req, res) => {
  res.json({ success: true, inventory: dbMock.inventory });
};

module.exports = {
  getInventory
};
