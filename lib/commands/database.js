"use strict";

var _yargs = require("../core/yargs");

var _migrator = require("../core/migrator");

var _helpers = _interopRequireDefault(require("../helpers"));

var _lodash = require("lodash");

var _cliColor = _interopRequireDefault(require("cli-color"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Sequelize = _helpers.default.generic.getSequelize();

exports.builder = yargs => (0, _yargs._baseOptions)(yargs).option('charset', {
  describe: 'Pass charset option to dialect, MYSQL only',
  type: 'string'
}).option('collate', {
  describe: 'Pass collate option to dialect',
  type: 'string'
}).option('encoding', {
  describe: 'Pass encoding option to dialect, PostgreSQL only',
  type: 'string'
}).option('ctype', {
  describe: 'Pass ctype option to dialect, PostgreSQL only',
  type: 'string'
}).option('template', {
  describe: 'Pass template option to dialect, PostgreSQL only',
  type: 'string'
}).argv;

exports.handler = async function (args) {
  const command = args._[0]; // legacy, gulp used to do this

  await _helpers.default.config.init();
  const sequelize = getDatabaseLessSequelize();

  const config = _helpers.default.config.readConfig();

  switch (command) {
    case 'db:create':
      const options = (0, _lodash.pick)(args, ['charset', 'collate', 'encoding', 'ctype', 'template']);
      const query = getCreateDatabaseQuery(sequelize, config, options);
      await sequelize.query(query, {
        type: sequelize.QueryTypes.RAW
      }).catch(e => _helpers.default.view.error(e));

      _helpers.default.view.log('Database', _cliColor.default.blueBright(config.database), 'created.');

      break;

    case 'db:drop':
      await sequelize.query(`DROP DATABASE IF EXISTS ${sequelize.getQueryInterface().quoteIdentifier(config.database)}`, {
        type: sequelize.QueryTypes.RAW
      }).catch(e => _helpers.default.view.error(e));

      _helpers.default.view.log('Database', _cliColor.default.blueBright(config.database), 'dropped.');

      break;
  }

  process.exit(0);
};

function getCreateDatabaseQuery(sequelize, config, options) {
  switch (config.dialect) {
    case 'postgres':
    case 'postgres-native':
      return 'CREATE DATABASE ' + sequelize.getQueryInterface().quoteIdentifier(config.database) + (options.encoding ? ' ENCODING = ' + sequelize.getQueryInterface().quoteIdentifier(options.encoding) : '') + (options.collate ? ' LC_COLLATE = ' + sequelize.getQueryInterface().quoteIdentifier(options.collate) : '') + (options.ctype ? ' LC_CTYPE = ' + sequelize.getQueryInterface().quoteIdentifier(options.ctype) : '') + (options.template ? ' TEMPLATE = ' + sequelize.getQueryInterface().quoteIdentifier(options.template) : '');

    case 'mysql':
      return 'CREATE DATABASE IF NOT EXISTS ' + sequelize.getQueryInterface().quoteIdentifier(config.database) + (options.charset ? ' DEFAULT CHARACTER SET ' + sequelize.getQueryInterface().quoteIdentifier(options.charset) : '') + (options.collate ? ' DEFAULT COLLATE ' + sequelize.getQueryInterface().quoteIdentifier(options.collate) : '');

    case 'mssql':
      return 'IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N\'' + config.database + '\')' + ' BEGIN' + ' CREATE DATABASE ' + sequelize.getQueryInterface().quoteIdentifier(config.database) + (options.collate ? ' COLLATE ' + options.collate : '') + ' END;';
      break;

    default:
      _helpers.default.view.error(`Dialect ${config.dialect} does not support db:create / db:drop commands`);

      return 'CREATE DATABASE ' + sequelize.getQueryInterface().quoteIdentifier(config.database);
  }
}

function getDatabaseLessSequelize() {
  let config = null;

  try {
    config = _helpers.default.config.readConfig();
  } catch (e) {
    _helpers.default.view.error(e);
  }

  config = (0, _lodash.cloneDeep)(config);
  config = (0, _lodash.defaults)(config, {
    logging: _migrator.logMigrator
  });

  switch (config.dialect) {
    case 'postgres':
    case 'postgres-native':
      config.database = 'postgres';
      break;

    case 'mysql':
      delete config.database;
      break;

    case 'mssql':
      config.database = 'master';
      break;

    default:
      _helpers.default.view.error(`Dialect ${config.dialect} does not support db:create / db:drop commands`);

  }

  try {
    return new Sequelize(config);
  } catch (e) {
    _helpers.default.view.error(e);
  }
}