'use strict';

const nodeify = require('nodeify');

module.exports = {
  up(migration, DataTypes, done) {
    nodeify(migration
      .bulkInsert('Person', [{
        name: 'Jane Doe',
        isBetaMember: false
      }], {
        name: {},
        isBetaMember: {}
      }), done);
  },
  down(migration, DataTypes, done) {
    nodeify(migration.bulkDelete('Person', null, {}), done);
  }
};
