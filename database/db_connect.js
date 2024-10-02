var config = {
  user: "zihan",
  password: "7828",
  server: "10.12.3.182",
  database: "QMESReport",
  port: 1433,
  options: {
    trustedConnection: true,
    encrypt: false,
    enableArithAbort: true,
    requestTimeout: 180000,
    idleTimeoutMillis: 180000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 180000, // Set pool idle timeout to 60 seconds
    acquireTimeoutMillis: 180000, // Set pool acquire timeout to 60 seconds
  },
};

var config1 = {
  user: "sa",
  password: "Admin@1234",
  server: "10.12.13.164",
  database: "QMSDatabaseWFX",
  port: 1433,
  options: {
    trustedConnection: true,
    encrypt: false,
    enableArithAbort: true,
    requestTimeout: 180000,
    idleTimeoutMillis: 180000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 180000, // Set pool idle timeout to 60 seconds
    acquireTimeoutMillis: 180000, // Set pool acquire timeout to 60 seconds
  },
};

module.exports = { config, config1 };
