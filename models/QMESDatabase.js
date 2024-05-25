const { config, config1 } = require("../database/db_connect");
var sql = require("mssql");

const pool1 = new sql.ConnectionPool(config1);
const poolConnect1 = pool1.connect();

function getPreviousDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  //   const hours = String(date.getHours()).padStart(2, "0");
  //   const minutes = String(date.getMinutes()).padStart(2, "0");
  //   const seconds = String(date.getSeconds()).padStart(2, "0");
  //   return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return `${year}-${month}-${day}`;
}

const dailyKnittingIncentiveDay = async () => {
  await poolConnect1;

  const request = pool1.request();

  let sqlQuery = `SELECT 
  a.Module,
  a.Line,
  a.EmployeeCode,
  a.EmployeeName,
  a.MCCount,
  a.StyleName,
  a.Size,
  a.UsedQty,
  a.Shift,
  a.ShiftDate
FROM (
  SELECT  
      ic.Module,
      ic.Line,
      eo.EmployeeCode,
      et.EmployeeName,
      ic.MCCount,
      st.StyleName,
      mb.Size,
      eo.UsedQty,
      CASE 
          WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '09:00' AND '20:59' THEN 'Day Shift'
          WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '21:00' AND '23:59' THEN 'Night Shift'
          WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '00:00' AND '08:59' THEN 'Night Shift'
          ELSE 'None'
      END AS [Shift],
      CASE 
          WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '09:00' AND '20:59' THEN eo.[CreatedDate]
          WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '21:00' AND '23:59' THEN DATEADD(DAY, 0, CAST(eo.[CreatedDate] AS DATE))
          WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '00:00' AND '08:59' THEN eo.[CreatedDate]
          ELSE NULL
      END AS [ShiftDate]
  FROM 
      IncentiveDB..IncentiveOperationScanTableKnitting eo
  INNER JOIN 
      IncentiveDB..EmployeeTableKnitting et ON et.EmployeeCode = eo.EmployeeCode
  INNER JOIN 
      PMSCelsiusDB..BarcodeGenarationTable gb ON eo.BarcodeNo = gb.BarcodePrimaryKey
  INNER JOIN 
      PMSCelsiusDB..MasterBarcodeGenaration mb ON gb.MasterGenarationId = mb.MasterGenarationId
  INNER JOIN 
      PMSCelsiusDB..Style_table st ON st.StyleId = mb.StyleNo
  INNER JOIN 
      IncentiveDB..IncentiveMachineCount ic ON ic.OperatorID = et.EmployeeCode
  WHERE 
      Designation != 'IT' 
      AND CONVERT(DATE, eo.[CreatedDate]) = convert(nvarchar,getdate()-1,23)
      AND ic.Date = FORMAT(CAST(convert(nvarchar,getdate()-1,23) AS DATE), 'dd-MMM-yy') 
      AND ic.Shift = 'Day'
) a 
WHERE a.Shift = 'Day Shift'`;
  //   console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        resolve(result.recordset);
      }
    });
  });
};

const dailyKnittingIncentiveNight = async () => {
  await poolConnect1;

  const request = pool1.request();

  let sqlQuery = `SELECT 
    a.Module,
    a.Line,
    a.EmployeeCode,
    a.EmployeeName,
    a.MCCount,
    a.StyleName,
    a.Size,
    a.UsedQty,
    a.Shift,
    a.ShiftDate
  FROM (
    SELECT  
        ic.Module,
        ic.Line,
        eo.EmployeeCode,
        et.EmployeeName,
        ic.MCCount,
        st.StyleName,
        mb.Size,
        eo.UsedQty,
        CASE 
            WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '09:00' AND '20:59' THEN 'Day Shift'
            WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '21:00' AND '23:59' THEN 'Night Shift'
            WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '00:00' AND '08:59' THEN 'Night Shift'
            ELSE 'None'
        END AS [Shift],
        CASE 
            WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '09:00' AND '20:59' THEN eo.[CreatedDate]
            WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '21:00' AND '23:59' THEN DATEADD(DAY, 0, CAST(eo.[CreatedDate] AS DATE))
            WHEN CONVERT(VARCHAR(5), eo.[CreatedDate], 108) BETWEEN '00:00' AND '08:59' THEN eo.[CreatedDate]
            ELSE NULL
        END AS [ShiftDate]
    FROM 
        IncentiveDB..IncentiveOperationScanTableKnitting eo
    INNER JOIN 
        IncentiveDB..EmployeeTableKnitting et ON et.EmployeeCode = eo.EmployeeCode
    INNER JOIN 
        PMSCelsiusDB..BarcodeGenarationTable gb ON eo.BarcodeNo = gb.BarcodePrimaryKey
    INNER JOIN 
        PMSCelsiusDB..MasterBarcodeGenaration mb ON gb.MasterGenarationId = mb.MasterGenarationId
    INNER JOIN 
        PMSCelsiusDB..Style_table st ON st.StyleId = mb.StyleNo
    INNER JOIN 
        IncentiveDB..IncentiveMachineCount ic ON ic.OperatorID = et.EmployeeCode
    WHERE 
        Designation != 'IT' 
        AND CONVERT(DATE, eo.[CreatedDate]) = convert(nvarchar,getdate()-1,23)
        AND ic.Date = FORMAT(CAST(convert(nvarchar,getdate()-1,23) AS DATE), 'dd-MMM-yy') 
        AND ic.Shift = 'Night'
  ) a 
  WHERE a.Shift = 'Night Shift'`;
  //   console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        resolve(result.recordset);
      }
    });
  });
};

module.exports = {
  dailyKnittingIncentiveDay,
  dailyKnittingIncentiveNight,
};
