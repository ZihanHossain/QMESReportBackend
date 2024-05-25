var express = require("express");
var router = express.Router();
const xlsx = require("xlsx");
const moment = require("moment-timezone");
const multer = require("multer");
const path = require("path");
const schedule = require("node-schedule");

const { config, config1 } = require("../database/db_connect");
var sql = require("mssql");
const {
  dailyKnittingIncentiveDay,
  dailyKnittingIncentiveNight,
} = require("../models/QMESDatabase");

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();
const pool1 = new sql.ConnectionPool(config1);
const poolConnect1 = pool1.connect();

const SMVstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "E:/Test");
  },
  filename: (req, file, cb) => {
    cb(null, "Knitting SMV.xlsx");
  },
});

const SMVupload = multer({ storage: SMVstorage });

//Api Starts
router.post("/uploadSMV", SMVupload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).send("File uploaded successfully.");
});

const QASummarystorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "E:/Test");
  },
  filename: (req, file, cb) => {
    cb(null, "Knitting Qa Summary.xlsx");
  },
});

const QASummaryupload = multer({ storage: QASummarystorage });

//Api Starts
router.post("/uploadQASummary", QASummaryupload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).send("File uploaded successfully.");
});

router.get("/export_smv", async function (req, res, next) {
  try {
    await poolConnect;

    const request = pool.request();

    // Path to your Excel file
    const filePath = "E:/Test/Knitting SMV.xlsx";

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON format
    const data = xlsx.utils.sheet_to_json(sheet);
    // console.log(sheetName);

    // Output the data
    // console.log(data);
    const promises = [];

    data.forEach((element) => {
      let sqlQuery = `
      MERGE INTO SMV AS target
      USING (VALUES ('${element.Style}', '${element.Size}', ${element.SMV})) AS source (style, size, smv)
      ON target.style = source.style AND target.size = source.size
      WHEN MATCHED THEN
          UPDATE SET smv = source.smv
      WHEN NOT MATCHED THEN
          INSERT (style, size, smv) VALUES (source.style, source.size, source.smv);
    `;
      // console.log(sqlQuery);
      promises.push(
        request.query(sqlQuery).catch((err) => {
          console.log(err);
          throw new Error("error");
        })
      );
    });
    await Promise.all(promises);
    res.send("Data inserted successfully");
  } catch (err) {
    // console.log(err);
    res.status(500).send("An error occurred");
  }
});

router.get("/export_qa_summary", async function (req, res, next) {
  try {
    await poolConnect;

    const request = pool.request();

    // Path to your Excel file
    const filePath = "E:/Test/Knitting Qa Summary.xlsx";

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON format
    const data = xlsx.utils.sheet_to_json(sheet);
    // console.log(sheetName);

    // Output the data
    // console.log(data);

    // Create an array to hold all the promises
    const promises = [];

    data.forEach((element) => {
      const result = [];

      const opId = element["OP ID"];
      const opName = element["OP Name"];

      for (const key in element) {
        if (key !== "OP ID" && key !== "OP Name") {
          result.push({
            "OP ID": opId,
            "OP Name": opName,
            date: key,
            value: element[key],
          });
        }
      }
      // console.log(result);

      result.forEach((element) => {
        let sqlQuery = `MERGE INTO QaSummary AS target
        USING (VALUES ('${element.date}', '${element["OP ID"]}', ${element.value}, 'P')) AS source (date, employee_id, qa_percentage, attendance)
        ON target.date = source.date AND target.employee_id = source.employee_id
        WHEN MATCHED THEN
            UPDATE SET qa_percentage = source.qa_percentage
        WHEN NOT MATCHED THEN
            INSERT (date, employee_id, qa_percentage, attendance) VALUES (source.date, source.employee_id, source.qa_percentage, source.attendance);`;

        // let sqlQuery = `INSERT INTO QaSummary(date, employee_id, qa_percentage, attendance) VALUES('${element.date}', '${element["OP ID"]}', ${element.value}, 'P')`;

        // Add the promise to the array
        promises.push(
          request.query(sqlQuery).catch((err) => {
            console.log(err);
            throw new Error("error");
          })
        );
      });
    });

    // Wait for all the promises to resolve
    await Promise.all(promises);
    res.send("Data inserted successfully");
  } catch (err) {
    // console.log(err);
    res.status(500).send("An error occurred");
  }
});

router.get("/daily_knitting_incentive_day", async function (req, res, next) {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyKnittingIncentiveDay();

    response.forEach((element) => {
      let sqlQuery = `INSERT INTO KnittingIncentive(Module, Line, EmployeeCode, EmployeeName, MCCount, StyleName, Size, UsedQty, Shift, ShiftDate)
      VALUES(${element.Module}, ${element.Line}, ${element.EmployeeCode}, '${
        element.EmployeeName
      }', ${element.MCCount}, '${element.StyleName}', '${element.Size}', ${
        element.UsedQty
      }, '${element.Shift}', '${moment
        .utc(element.ShiftDate)
        .format("MM/DD/YYYY HH:mm:ss")}')`;
      return new Promise((resolve, reject) => {
        request.query(sqlQuery, async function (err, result) {
          if (err) {
            console.log(err);
            reject("error");
          } else {
            resolve(result.rowsAffected);
          }
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

async function KnittingIncentiveDay() {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyKnittingIncentiveDay();

    const promises = response.map((element) => {
      const sqlQuery = `INSERT INTO KnittingIncentive(Module, Line, EmployeeCode, EmployeeName, MCCount, StyleName, Size, UsedQty, Shift, ShiftDate)
        VALUES(${element.Module}, ${element.Line}, ${element.EmployeeCode}, '${
        element.EmployeeName
      }', ${element.MCCount}, '${element.StyleName}', '${element.Size}', ${
        element.UsedQty
      }, '${element.Shift}', '${moment
        .utc(element.ShiftDate)
        .format("MM/DD/YYYY HH:mm:ss")}')`;

      return new Promise((resolve, reject) => {
        request.query(sqlQuery, (err, result) => {
          if (err) {
            console.error("Error executing query:", err);
            reject(err);
          } else {
            resolve(result.rowsAffected);
          }
        });
      });
    });

    await Promise.all(promises);
    console.log("All KnittingIncentiveDay records inserted successfully.");
  } catch (error) {
    console.error("Error in KnittingIncentiveDay:", error);
    throw error; // Rethrow the error to propagate it to the caller
  }
}

router.get("/daily_knitting_incentive_night", async function (req, res, next) {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyKnittingIncentiveNight();

    response.forEach((element) => {
      let sqlQuery = `INSERT INTO KnittingIncentive(Module, Line, EmployeeCode, EmployeeName, MCCount, StyleName, Size, UsedQty, Shift, ShiftDate)
      VALUES(${element.Module}, ${element.Line}, ${element.EmployeeCode}, '${
        element.EmployeeName
      }', ${element.MCCount}, '${element.StyleName}', '${element.Size}', ${
        element.UsedQty
      }, '${element.Shift}', '${moment
        .utc(element.ShiftDate)
        .format("MM/DD/YYYY HH:mm:ss")}')`;
      return new Promise((resolve, reject) => {
        request.query(sqlQuery, async function (err, result) {
          if (err) {
            console.log(err);
            reject("error");
          } else {
            resolve(result.rowsAffected);
          }
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

async function KnittingIncentiveNight() {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyKnittingIncentiveNight();

    response.forEach((element) => {
      let sqlQuery = `INSERT INTO KnittingIncentive(Module, Line, EmployeeCode, EmployeeName, MCCount, StyleName, Size, UsedQty, Shift, ShiftDate)
      VALUES(${element.Module}, ${element.Line}, ${element.EmployeeCode}, '${
        element.EmployeeName
      }', ${element.MCCount}, '${element.StyleName}', '${element.Size}', ${
        element.UsedQty
      }, '${element.Shift}', '${moment
        .utc(element.ShiftDate)
        .format("MM/DD/YYYY HH:mm:ss")}')`;
      return new Promise((resolve, reject) => {
        request.query(sqlQuery, async function (err, result) {
          if (err) {
            console.log(err);
            reject("error");
          } else {
            resolve(result.rowsAffected);
          }
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}

async function executeJob() {
  try {
    console.log("Knitting Incentive Day Data Pull Started");
    await KnittingIncentiveDay();
    console.log("Knitting Incentive Day Data Pull Successful");
    console.log("Knitting Incentive Night Data Pull Started");
    await KnittingIncentiveNight();
    console.log("Knitting Incentive Night Data Pull Successful");
  } catch (error) {
    console.error("Error in executeJob:", error);
  }
}

// Define the schedule rule
const rule = new schedule.RecurrenceRule();
rule.hour = [12];
rule.minute = 0;

// Define the schedule job
const job = schedule.scheduleJob(rule, function () {
  executeJob();
});

module.exports = router;
