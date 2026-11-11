const backend = require('../apps/backend/dist/index.js');
const app = backend.default || backend;

module.exports = app;
