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
  dailyLinkingIncentive,
  dailyKnittingProductionNightPreviousDay,
  dailyKnittingProductionNight,
  dailyKnittingProductionDay,
} = require("../models/QMESDatabase");

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();
const pool1 = new sql.ConnectionPool(config1);
const poolConnect1 = pool1.connect();

const excelDateToJSDate = (serial) => {
  let utc_days = Math.floor(serial - 25569);
  let utc_value = utc_days * 86400;
  let date_info = new Date(utc_value * 1000);

  let fractional_day = serial - Math.floor(serial) + 0.0000001;

  let total_seconds = Math.floor(86400 * fractional_day);

  let seconds = total_seconds % 60;

  total_seconds -= seconds;

  let hours = Math.floor(total_seconds / (60 * 60));
  let minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds
  );
};

const formatDate = (date) => {
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const SMVstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "E:/Zihan/QMESReport/Files");
  },
  filename: (req, file, cb) => {
    cb(null, "Knitting SMV.xlsx");
  },
});

const SMVupload = multer({ storage: SMVstorage });

//Api Starts
router.post("/uploadSMV", SMVupload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.status(200).send("File uploaded successfully.");
  } catch (err) {
    console.log(err);
  }
});

const QASummarystorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "E:/Zihan/QMESReport/Files");
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

  const workbook = xlsx.readFile(req.file.path);
  const sheet_name_list = workbook.SheetNames;
  const worksheet = workbook.Sheets[sheet_name_list[0]];

  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = jsonData[0];

  // Expected headers
  const expectedHeaders = ["OP ID", "OP Name"];

  // Check if first two headers are 'OP ID' and 'OP Name'
  if (headers[0] !== expectedHeaders[0] || headers[1] !== expectedHeaders[1]) {
    return res
      .status(400)
      .send(
        "Invalid file format. First two columns should be 'OP ID' and 'OP Name'."
      );
  }

  // Check if remaining headers are valid dates
  // for (let i = 2; i < headers.length; i++) {
  //   if (!moment(headers[i], moment.ISO_8601, true).isValid()) {
  //     return res
  //       .status(400)
  //       .send(`Invalid date format in column ${i + 1}: ${headers[i]}.`);
  //   }
  // }

  // If all validations pass
  res.status(200).send("File uploaded successfully.");
});

const WhmLinkingstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "E:/Zihan/QMESReport/Files");
  },
  filename: (req, file, cb) => {
    cb(null, "WhMLinking.xlsx");
  },
});

const WhmLinkingupload = multer({ storage: WhmLinkingstorage });

//Api Starts
router.post(
  "/uploadWhmLinking",
  WhmLinkingupload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    let filePath = req.file.path;

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetNameList = workbook.SheetNames;
      const worksheet = workbook.Sheets[sheetNameList[0]];

      // Convert the worksheet to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // Clear filters by creating a new sheet without filters
      const newWorksheetData = xlsx.utils.aoa_to_sheet(jsonData);
      workbook.Sheets[sheetNameList[0]] = newWorksheetData;

      // Extract headers from the cleaned data
      const headers = jsonData[0];

      // Expected headers
      const expectedHeaders = [
        "EmployeeCode",
        "Job Type",
        "WorkDate",
        "Round for IE",
      ];

      // Check if all expected headers are present in the uploaded file
      const headersExist = expectedHeaders.every((header) =>
        headers.includes(header)
      );

      if (!headersExist) {
        return res
          .status(400)
          .send(
            "Invalid file format. Your file must contain 'EmployeeCode', 'Job Type', 'WorkDate', and 'Round for IE' columns."
          );
      }

      // If all validations pass
      res.status(200).send("File uploaded successfully.");
    } catch (error) {
      console.error(error);
      return res.status(500).send("Error processing file.");
    }
  }
);

const attendanceKnittingstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "E:/Zihan/QMESReport/Files");
  },
  filename: (req, file, cb) => {
    cb(null, "attendanceKnitting.xlsx");
  },
});

const attendanceKnittingupload = multer({ storage: attendanceKnittingstorage });

//Api Starts
router.post(
  "/uploadAttendanceKnitting",
  attendanceKnittingupload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet_name_list = workbook.SheetNames;
    const worksheet = workbook.Sheets[sheet_name_list[0]];

    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = jsonData[0];

    // Extract the ID and date columns
    const idIndex = headers.indexOf("ID");
    const dateIndexes = headers
      .map((header, index) => {
        return typeof header === "number" && header > 40000 ? index : null;
      })
      .filter((index) => index !== null);

    if (idIndex === -1 || dateIndexes.length === 0) {
      return res
        .status(400)
        .send("Invalid file format. Required columns not found.");
    }

    const extractedData = jsonData.slice(1).map((row) => {
      const result = { ID: row[idIndex] };
      dateIndexes.forEach((index) => {
        // Convert Excel serial date to JS date
        const date = moment("1899-12-30")
          .add(row[index], "days")
          .format("YYYY-MM-DD");
        result[headers[index]] = date;
      });
      return result;
    });

    // If all validations pass
    res.status(200).send("File uploaded successfully.");
  }
);

const LinkingSMVstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "E:/Zihan/QMESReport/Files");
  },
  filename: (req, file, cb) => {
    cb(null, "LinkingSMV.xlsx");
  },
});

const LinkingSMVupload = multer({ storage: LinkingSMVstorage });

//Api Starts
router.post(
  "/uploadLinkingSMV",
  LinkingSMVupload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet_name_list = workbook.SheetNames;
    const worksheet = workbook.Sheets[sheet_name_list[0]];

    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = jsonData[0];

    // Expected headers
    const expectedHeaders = ["Buyer", "Style", "OperationName", "SMV"];

    // Check if all expected headers are present in the uploaded file
    const headersExist = expectedHeaders.every((header) =>
      headers.includes(header)
    );

    if (!headersExist) {
      return res
        .status(400)
        .send(
          "Invalid file format. Your file must contain 'Buyer', 'Style', 'OperationName', and 'SMV' columns."
        );
    }

    // If all validations pass
    res.status(200).send("File uploaded successfully.");
  }
);

router.get("/export_smv", async function (req, res, next) {
  try {
    await poolConnect;

    const request = pool.request();

    // Path to your Excel file
    const filePath = "E:/Zihan/QMESReport/Files/Knitting SMV.xlsx";

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

router.get("/export_linking_smv", async function (req, res, next) {
  try {
    await poolConnect;

    // Path to your Excel file
    const filePath = "E:/Zihan/QMESReport/Files/LinkingSMV.xlsx";

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON format
    const data = xlsx.utils.sheet_to_json(sheet);

    // Output the data
    const promises = [];

    data.forEach((element, index) => {
      // Log the element to debug the issue
      // console.log(`Processing element at index ${index}:`, element);

      // Ensure all fields are strings and handle Unicode characters correctly
      const buyer = String(element.Buyer || "");
      const style = String(element.Style || "");
      const operationName = String(element.OperationName || "");
      const smv = parseFloat(element.SMV); // Ensure SMV is a number

      // Create a new request instance for each iteration
      const request = pool.request();

      const sqlQuery = `
        MERGE INTO LinkingSMV AS target
        USING (VALUES (N'${buyer}', N'${style}', N'${operationName}', @SMV)) AS source (buyer, style, operation_name, smv)
        ON target.style = source.style AND target.buyer = source.buyer AND target.operation_name = source.operation_name
        WHEN MATCHED THEN
            UPDATE SET smv = source.smv
        WHEN NOT MATCHED THEN
            INSERT (buyer, style, operation_name, smv) VALUES (source.buyer, source.style, source.operation_name, source.smv);
      `;

      // Add parameters to the request
      request.input("SMV", sql.Float, smv);

      // Push the promise to the array
      promises.push(
        request.query(sqlQuery).catch((err) => {
          console.log(err);
          throw new Error("error");
        })
      );
    });

    // Wait for all promises to resolve
    await Promise.all(promises);
    res.send("Data inserted successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred");
  }
});

router.get("/export_qa_summary", async function (req, res, next) {
  try {
    await poolConnect;

    const request = pool.request();

    // Path to your Excel file
    const filePath = "E:/Zihan/QMESReport/Files/Knitting Qa Summary.xlsx";

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
      // console.log(element);

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

        // console.log(sqlQuery);

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

router.get("/export_attendance_knitting", async function (req, res, next) {
  try {
    await poolConnect;

    const request = pool.request();

    // Path to your Excel file
    const filePath = "E:/Zihan/QMESReport/Files/attendanceKnitting.xlsx";

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
      const opId = element["ID"];

      for (const key in element) {
        if (key !== "ID") {
          // Check if the key is a valid Excel serial date number
          const datePattern = /^\d{1,2}-[A-Za-z]{3}$/;
          if (datePattern.test(key)) {
            result.push({
              ID: opId,
              date: key,
              value: element[key],
            });
          }
        }
      }

      result.forEach((element) => {
        let sqlQuery = `MERGE INTO KnittingAttendance AS target
        USING (VALUES (${element.ID}, '${element.date}', '${element.value}')) AS source (employee_id, date, value)
        ON target.date = CONVERT(date, PARSE(source.date AS datetime USING 'en-US')) AND target.employee_id = source.employee_id
        WHEN MATCHED THEN
            UPDATE SET value = source.value
        WHEN NOT MATCHED THEN
            INSERT (employee_id, date, value) VALUES (source.employee_id, CONVERT(date, PARSE(source.date AS datetime USING 'en-US')), source.value);`;

        // console.log(sqlQuery);

        // Add the promise to the array
        promises.push;
        request.query(sqlQuery).catch((err) => {
          console.log(err);
          throw new Error("error");
        });
      });
    });

    // Wait for all the promises to resolve
    await Promise.all(promises);
    res.send("Data inserted successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred");
  }
});

router.get("/export_whm_linking", async function (req, res, next) {
  try {
    await poolConnect;

    const request = pool.request();

    // Path to your Excel file
    const filePath = "E:/Zihan/QMESReport/Files/WhMLinking.xlsx";

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
      // let jsDate = excelDateToJSDate(element.WorkDate);
      let workDate = formatDate(excelDateToJSDate(element.WorkDate));

      let sqlQuery = `
        MERGE INTO WhMLinking AS target
        USING (VALUES ('${element.EmployeeCode}', '${element["Job Type"]}', '${workDate}', '${element["Round for IE"]}')) AS source (employee_id, jobType, date, whm)
        ON target.employee_id = source.employee_id AND target.date = source.date
        WHEN MATCHED THEN
            UPDATE SET target.jobType = source.jobType, target.whm = source.whm
        WHEN NOT MATCHED THEN
            INSERT (employee_id, jobType, date, whm)
            VALUES (source.employee_id, source.jobType, source.date, source.whm);
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
    console.log(err);
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
    let records = 0;

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
            records = records + result.rowsAffected;
            resolve(result.rowsAffected);
          }
        });
      });
    });

    await Promise.all(promises);
    console.log("KnittingIncentiveDay records pushed: " + records);
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
    let records = 0;

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
            records = records + result.rowsAffected;
            resolve(result.rowsAffected);
          }
        });
      });
    });
    console.log("KnittingIncentiveNight records pushed: " + records);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}

async function LinkingIncentive() {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyLinkingIncentive();
    let records = 0;

    for (const element of response) {
      const sqlQuery = `INSERT INTO LinkingIncentive(Date, EmployeeCode, OperationName, EmployeeName, BarcodeNo, Line, Floor, UsedQty, StyleName, BuyerName, BusinessUnit)
      VALUES('${element.Date}', ${element.EmployeeCode}, N'${element.OperationName}', '${element.EmployeeName}', ${element.BarcodeNo}, ${element.LineInfo}, '${element.Floor}', ${element.UsedQty}, '${element.StyleName}', '${element.BuyerName}', '${element.BusinessUnit}')`;

      // console.log(sqlQuery);

      await new Promise((resolve, reject) => {
        request.query(sqlQuery, function (err, result) {
          if (err) {
            console.log(err);
            reject("error");
          } else {
            records = records + result.rowsAffected;
            resolve(result.rowsAffected);
          }
        });
      });
    }
    console.log("LinkingIncentive records pushed: " + records);
    return "Completed";
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
}

async function KnittingProductionNightPreviousDay() {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyKnittingProductionNightPreviousDay();
    let records = 0;

    // Insert data into KnittingProduction table
    for (const element of response) {
      const sqlQuery = `INSERT INTO KnittingProduction (OCNo, StyleName, Stylecode, PoNumber, date, Floor, Color, Size, BatchQty, BuyerName)
      VALUES('${element.OCNo}', '${element.StyleName}', '${element.Stylecode}', '${element.PoNumber}', '${element.date}', '${element.Floor}', '${element.Color}', '${element.Size}', ${element.BatchQty}, '${element.BuyerName}')`;

      // console.log(sqlQuery);

      await new Promise((resolve, reject) => {
        request.query(sqlQuery, function (err, result) {
          if (err) {
            console.log(err);
            reject("error");
          } else {
            records = records + result.rowsAffected;
            resolve(result.rowsAffected);
          }
        });
      });
    }
    console.log(
      "KnittingProductionNightPreviousDay records pushed: " + records
    );
    return "Completed";
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
}

async function KnittingProductionNight() {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyKnittingProductionNight();
    let records = 0;

    // Insert data into KnittingProduction table
    for (const element of response) {
      const sqlQuery = `INSERT INTO KnittingProduction (OCNo, StyleName, Stylecode, PoNumber, date, Floor, Color, Size, BatchQty, BuyerName)
      VALUES('${element.OCNo}', '${element.StyleName}', '${element.Stylecode}', '${element.PoNumber}', '${element.date}', '${element.Floor}', '${element.Color}', '${element.Size}', ${element.BatchQty}, '${element.BuyerName}')`;

      // console.log(sqlQuery);

      await new Promise((resolve, reject) => {
        request.query(sqlQuery, function (err, result) {
          if (err) {
            console.log(err);
            reject("error");
          } else {
            records = records + result.rowsAffected;
            resolve(result.rowsAffected);
          }
        });
      });
    }
    console.log("KnittingProductionNight records pushed: " + records);
    return "Completed";
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
}

async function KnittingProductionDay() {
  await poolConnect;

  const request = pool.request();
  try {
    const response = await dailyKnittingProductionDay();
    let records = 0;

    // Insert data into KnittingProduction table
    for (const element of response) {
      const sqlQuery = `INSERT INTO KnittingProduction (OCNo, StyleName, Stylecode, PoNumber, date, Floor, Color, Size, BatchQty, BuyerName)
      VALUES('${element.OCNo}', '${element.StyleName}', '${element.Stylecode}', '${element.PoNumber}', '${element.date}', '${element.Floor}', '${element.Color}', '${element.Size}', ${element.BatchQty}, '${element.BuyerName}')`;

      // console.log(sqlQuery);

      await new Promise((resolve, reject) => {
        request.query(sqlQuery, function (err, result) {
          if (err) {
            console.log(err);
            reject("error");
          } else {
            records = records + result.rowsAffected;
            resolve(result.rowsAffected);
          }
        });
      });
    }
    console.log("KnittingProductionDay records pushed: " + records);
    return "Completed";
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
}

// router.get("/update", async function (req, res, next) {
//   console.log("Knitting Incentive Day Data Push Started");
//   await KnittingIncentiveDay();
//   console.log("Knitting Incentive Day Data Push Successful");
//   console.log("Knitting Incentive Night Data Push Started");
//   await KnittingIncentiveNight();
//   console.log("Knitting Incentive Night Data Push Successful");
// });

async function executeJob() {
  try {
    await KnittingIncentiveDay();
    console.log(
      "Knitting Incentive Day Data Push Successful: " +
        new Date().toLocaleString()
    );
    await KnittingIncentiveNight();
    console.log(
      "Knitting Incentive Night Data Push Successful: " +
        new Date().toLocaleString()
    );
    LinkingIncentive()
      .then(
        (result) =>
          (result = "Completed"
            ? console.log(
                "Linking Incentive Data Pull Successful: " +
                  new Date().toLocaleString()
              )
            : console.log(
                "Linking Incentive Data Pull Failed: " +
                  new Date().toLocaleString()
              ))
      )
      .catch((error) => console.error(error));
    KnittingProductionNightPreviousDay()
      .then((result) => {
        if (result === "Completed") {
          console.log(
            "Knitting Production NightPreviousDay Data Pull Successful: " +
              new Date().toLocaleString()
          );
          return KnittingProductionNight();
        } else {
          console.log(
            "Knitting Production NightPreviousDay Data Pull Failed: " +
              new Date().toLocaleString()
          );
          throw new Error(
            "Knitting Production NightPreviousDay Data Pull Failed: " +
              new Date().toLocaleString()
          );
        }
      })
      .then((result) => {
        if (result === "Completed") {
          console.log(
            "Knitting Production Night Data Pull Successful: " +
              new Date().toLocaleString()
          );
          return KnittingProductionDay();
        } else {
          console.log(
            "Knitting Production Night Data Pull Failed: " +
              new Date().toLocaleString()
          );
          throw new Error(
            "Knitting Production Night Data Pull Failed: " +
              new Date().toLocaleString()
          );
        }
      })
      .then((result) => {
        if (result === "Completed") {
          console.log(
            "Knitting Production Day Data Pull Successful: " +
              new Date().toLocaleString()
          );
          console.log(".............");
        } else {
          console.log(
            "Knitting Production Day Data Pull Failed: " +
              new Date().toLocaleString()
          );
          throw new Error(
            "Knitting Production Day Data Pull Failed: " +
              new Date().toLocaleString()
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    console.error("Error in executeJob:", error);
  }
}

// Define the schedule rule
const rule = new schedule.RecurrenceRule();
rule.hour = [9];
rule.minute = 10;

// Define the schedule job
const job = schedule.scheduleJob(rule, function () {
  executeJob();
});

module.exports = router;
