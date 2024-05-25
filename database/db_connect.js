var config = {
  user: "zihan",
  password: "7828",
  server: "10.12.3.182",
  database: "QMESReport",
  port: 1433,
  options: {
    trustedConnection: true,
    encrypt: false,
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
  },
};

module.exports = { config, config1 };
