const APP_SUFFIX = process.env['APP_SUFFIX'] || '';
const API_SERVER = process.env['API_SERVER'] || 'http://localhost:8080/';
const API_ENTRY = `${APP_SUFFIX}/api.cgi`;

let proxy = {
  '/images': {
    'target': API_SERVER
  }
};

proxy[API_ENTRY] = {
  'target': API_SERVER
};

module.exports = proxy;
