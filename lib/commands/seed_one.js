"use strict";

var _yargs = require("../core/yargs");

var _migrator = require("../core/migrator");

var _helpers = _interopRequireDefault(require("../helpers"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.builder = yargs => (0, _yargs._baseOptions)(yargs).option('seed', {
  describe: 'List of seed files',
  type: 'array'
}).argv;

exports.handler = async function (args) {
  const command = args._[0]; // legacy, gulp used to do this

  await _helpers.default.config.init(); // filter out cmd names
  // for case like --seeders-path seeders --seed seedPerson.js db:seed

  const seeds = (args.seed || []).filter(name => name !== 'db:seed' && name !== 'db:seed:undo').map(file => _path.default.basename(file));

  switch (command) {
    case 'db:seed':
      await (0, _migrator.getMigrator)('seeder', args).then(migrator => {
        return migrator.up(seeds);
      }).catch(e => _helpers.default.view.error(e));
      break;

    case 'db:seed:undo':
      await (0, _migrator.getMigrator)('seeder', args).then(migrator => {
        return migrator.down({
          migrations: seeds
        });
      }).catch(e => _helpers.default.view.error(e));
      break;
  }

  process.exit(0);
};