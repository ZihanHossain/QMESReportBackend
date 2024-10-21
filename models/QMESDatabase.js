const { config, config1 } = require("../database/db_connect");
var sql = require("mssql");

const pool1 = new sql.ConnectionPool(config1);
const poolConnect1 = pool1.connect();

const dailyKnittingIncentiveDay = async (date) => {
  await poolConnect1;

  const request = pool1.request();

  let sqlQuery;

  // auto generate everyday
  let autoSqlQuery = `SELECT distinct
  a.Module,
  a.Line,
  a.EmployeeCode,
  a.EmployeeName,
  a.MCCount,
  a.ChangeOverMachine,
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
      ic.ChangeOverMachine,
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
      AND ic.Date = CONVERT(VARCHAR, DAY(getdate()-1)) + '-' + LEFT(DATENAME(MONTH, getdate()-1), 3) + '-' + RIGHT(YEAR(getdate()-1), 2)
      AND ic.Shift = 'Day'
) a 
WHERE a.Shift = 'Day Shift'`;

  let manualSqlQuery = `SELECT distinct
a.Module,
a.Line,
a.EmployeeCode,
a.EmployeeName,
a.MCCount,
a.ChangeOverMachine,
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
    ic.ChangeOverMachine,
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
    AND CONVERT(DATE, eo.[CreatedDate]) = convert(nvarchar,'${date}',23)
    AND ic.Date = CONVERT(VARCHAR, DAY('${date}')) + '-' + LEFT(DATENAME(MONTH, '${date}'), 3) + '-' + RIGHT(YEAR('${date}'), 2)
    AND ic.Shift = 'Day'
) a 
WHERE a.Shift = 'Day Shift'`;
  //   console.log(sqlQuery);

  if (date) {
    sqlQuery = manualSqlQuery;
  } else {
    sqlQuery = autoSqlQuery;
  }

  // console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        console.log(
          "dailyKnittingIncentiveDay records pulled: " + result.rowsAffected
        );
        resolve(result.recordset);
      }
    });
  });
};

const dailyKnittingIncentiveNight = async (date) => {
  await poolConnect1;

  const request = pool1.request();

  let sqlQuery;

  let autoSqlQuery = `SELECT distinct
  a.Module,
  a.Line,
  a.EmployeeCode,
  a.EmployeeName,
  a.MCCount,
  a.ChangeOverMachine,
  a.StyleName,
  a.Size,
  a.UsedQty,
  a.Shift,
  CASE WHEN a.Shift = 'Night Shift' THEN DATEADD(day, -1, a.ShiftDate) ELSE a.ShiftDate END ShiftDate
FROM (
  SELECT  
      ic.Module,
      ic.Line,
      eo.EmployeeCode,
      et.EmployeeName,
      ic.MCCount,
      ic.ChangeOverMachine,
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
      AND CONVERT(DATE, eo.[CreatedDate]) = convert(nvarchar,getdate(),23)
      AND ic.Date = CONVERT(VARCHAR, DAY(GETDATE())) + '-' + LEFT(DATENAME(MONTH, GETDATE()), 3) + '-' + RIGHT(YEAR(GETDATE()), 2)
      AND ic.Shift = 'Night'
) a 
WHERE a.Shift = 'Night Shift'`;

  let manualSqlQuery = `SELECT distinct
a.Module,
a.Line,
a.EmployeeCode,
a.EmployeeName,
a.MCCount,
a.ChangeOverMachine,
a.StyleName,
a.Size,
a.UsedQty,
a.Shift,
CASE WHEN a.Shift = 'Night Shift' THEN DATEADD(day, -1, a.ShiftDate) ELSE a.ShiftDate END ShiftDate
FROM (
SELECT  
    ic.Module,
    ic.Line,
    eo.EmployeeCode,
    et.EmployeeName,
    ic.MCCount,
    ic.ChangeOverMachine,
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
    AND CONVERT(DATE, eo.[CreatedDate]) = convert(nvarchar,DATEADD(day, 1, '${date}'),23)
    AND ic.Date = CONVERT(VARCHAR, DAY(DATEADD(day, 1, '${date}'))) + '-' + LEFT(DATENAME(MONTH, DATEADD(day, 1, '${date}')), 3) + '-' + RIGHT(YEAR(DATEADD(day, 1, '${date}')), 2)
    AND ic.Shift = 'Night'
) a 
WHERE a.Shift = 'Night Shift'`;

  if (date) {
    sqlQuery = manualSqlQuery;
  } else {
    sqlQuery = autoSqlQuery;
  }

  console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        console.log(
          "dailyKnittingIncentiveNight records pulled: " + result.rowsAffected
        );
        resolve(result.recordset);
      }
    });
  });
};

const dailyLinkingIncentive = async () => {
  await poolConnect1;

  const request = pool1.request();

  let sqlQuery = `select convert(varchar,getdate()-1, 23) as Date ,eo.EmployeeCode,eo.OperationName,et.EmployeeName,tc.BarcodeNo,et.LineInfo,et.Floor,eo.UsedQty,st.StyleName,st.BuyerName, et.BusinessUnit
  from IncentiveDB..IncentiveOperationScanTable eo
  inner join IncentiveDB..EmployyeTable et on et.EmployeeCode=eo.EmployeeCode
  inner join PMSCelsiusDB..BarcodeGenarationTable gb ON eo.BarcodeNo=gb.BarcodePrimaryKey
  inner join PMSCelsiusDB..MasterBarcodeGenaration mb ON gb.MasterGenarationId=mb.MasterGenarationId
  inner join PMSCelsiusDB..Style_table st ON st.StyleId=mb.StyleNo
  inner join PMSCelsiusDB..BarcodeTCNoTable tc ON eo.BarcodeNo=tc.BarcodeNo
  
  where CAST(CONVERT(date,eo.CreatedDate) AS nvarchar(MAX))=CAST(CONVERT(date,GETDATE()-1) AS nvarchar(MAX))`;
  //   console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        console.log(
          "dailyLinkingIncentive records pulled: " + result.rowsAffected
        );
        resolve(result.recordset);
      }
    });
  });
};

const dailyKnittingProductionNightPreviousDay = async () => {
  await poolConnect1;

  const request = pool1.request();

  let sqlQuery = `select P.OCNo, X.StyleSubCat StyleName , Z.Stylecode, X.PoNumber,convert(nvarchar,getdate()-1,23) as date,Z.Floor, 
  X.Color,X.Size,sum(X.ColorBatchQty) BatchQty, X.BuyerName 
  from 
  (select BarcodeNo,BuyerName,StyleSubCat,PoNumber,Color,Size,BatchQty ColorBatchQty from [dbo].[QMSDataTable] where 
  ModuleName = 'Knitting' and BusinessUnit = 'Celsius-1' and
  BarcodeNo != 0 and
  /******* Night Shift *****/ 
  Date = convert(nvarchar,getdate()-2,23) and CAST(Time as time) >= '22:00:00' /**** Night Shift Start Date and Time ****/
  group by BarcodeNo, StyleSubCat,PoNumber,Color,BatchQty,BuyerName,Size
  )X
  join
  (select b.BarcodePrimaryKey,bu.BuyerName,s.StyleName,s.StyleCode,m.PONumber,m.Color,m.Floor,m.BusinessUnitId,m.BundleQuantity,m.GenaratedDate,m.CreateDate,m.Size,m.Shift
  from
  PMSCelsiusDB..BarcodeGenarationTable  b
  join  PMSCelsiusDB..MasterBarcodeGenaration m on b.MasterGenarationId = m.MasterGenarationId
  join PMSCelsiusDB..BuyerTable bu on  m.BuyerId = bu.BuyerId
  join PMSCelsiusDB..Style_table s on m.StyleNo = s.StyleId
  ) Z on X.BarcodeNo = Z.BarcodePrimaryKey
  join
  (select distinct  OCNo,PurchaseOrderNumber,Color,Size,StyleName,StyleCode from PMSCelsiusDB..PurchaseOrderTable) P on X.StyleSubCat = P.StyleName and X.PoNumber =P.PurchaseOrderNumber
  and X.Color = P.Color and X.Size = P.Size and Z.StyleCode = P.StyleCode
  group by 
   X.StyleSubCat,Z.Stylecode, X.PoNumber,Z.Floor, X.Color,X.Size,X.BuyerName,P.OCNo`;
  //   console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        console.log(
          "dailyKnittingProductionNightPreviousDay records pulled: " +
            result.rowsAffected
        );
        resolve(result.recordset);
      }
    });
  });
};

const dailyKnittingProductionNight = async () => {
  await poolConnect1;

  const request = pool1.request();

  let sqlQuery = `select P.OCNo, X.StyleSubCat StyleName , Z.Stylecode, X.PoNumber,convert(nvarchar,getdate()-1,23) as date,Z.Floor, 
  X.Color,X.Size,sum(X.ColorBatchQty) BatchQty, X.BuyerName 
  from 
  (select BarcodeNo,BuyerName,StyleSubCat,PoNumber,Color,Size,BatchQty ColorBatchQty from [dbo].[QMSDataTable] where 
  ModuleName = 'Knitting' and BusinessUnit = 'Celsius-1' and
  BarcodeNo != 0 and
  /******* Night Shift *****/ 
  Date = convert(nvarchar,getdate()-1,23) and CAST(Time as time) > '00:00:00' and CAST(Time as time) < '10:00:00'
  group by BarcodeNo, StyleSubCat,PoNumber,Color,BatchQty,BuyerName,Size
  )X
  join
  (select b.BarcodePrimaryKey,bu.BuyerName,s.StyleName,s.StyleCode,m.PONumber,m.Color,m.Floor,m.BusinessUnitId,m.BundleQuantity,m.GenaratedDate,m.CreateDate,m.Size,m.Shift
  from
  PMSCelsiusDB..BarcodeGenarationTable  b
  join  PMSCelsiusDB..MasterBarcodeGenaration m on b.MasterGenarationId = m.MasterGenarationId
  join PMSCelsiusDB..BuyerTable bu on  m.BuyerId = bu.BuyerId
  join PMSCelsiusDB..Style_table s on m.StyleNo = s.StyleId
  ) Z on X.BarcodeNo = Z.BarcodePrimaryKey
  join
  (select distinct  OCNo,PurchaseOrderNumber,Color,Size,StyleName,StyleCode from PMSCelsiusDB..PurchaseOrderTable) P on X.StyleSubCat = P.StyleName and X.PoNumber =P.PurchaseOrderNumber
  and X.Color = P.Color and X.Size = P.Size and Z.StyleCode = P.StyleCode
  group by 
   X.StyleSubCat,Z.Stylecode, X.PoNumber,Z.Floor, X.Color,X.Size,X.BuyerName,P.OCNo`;
  //   console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        console.log(
          "dailyKnittingProductionNight records pulled: " + result.rowsAffected
        );
        resolve(result.recordset);
      }
    });
  });
};

const dailyKnittingProductionDay = async () => {
  await poolConnect1;

  const request = pool1.request();
  request.timeout = 120000;

  let sqlQuery = `select P.OCNo, X.StyleSubCat StyleName , Z.Stylecode, X.PoNumber,convert(nvarchar,getdate()-1,23) as date,Z.Floor, 
  X.Color,X.Size,sum(X.ColorBatchQty) BatchQty, X.BuyerName 
  from 
  (select BarcodeNo,BuyerName,StyleSubCat,PoNumber,Color,Size,BatchQty ColorBatchQty from [dbo].[QMSDataTable] where 
  ModuleName = 'Knitting' and BusinessUnit = 'Celsius-1' and
  BarcodeNo != 0 and
  /********* Day Shift ******/ 
  Date = convert(nvarchar,getdate()-1,23) and CAST(Time as time) between '10:00:00' and '22:00:00'
  --and DefectType = 'Ok'
  group by BarcodeNo, StyleSubCat,PoNumber,Color,BatchQty,BuyerName,Size
  )X
  join
  (select b.BarcodePrimaryKey,bu.BuyerName,s.StyleName,s.StyleCode,m.PONumber,m.Color,m.Floor,m.BusinessUnitId,m.BundleQuantity,m.GenaratedDate,m.CreateDate,m.Size,m.Shift
  from
  PMSCelsiusDB..BarcodeGenarationTable  b
  join  PMSCelsiusDB..MasterBarcodeGenaration m on b.MasterGenarationId = m.MasterGenarationId
  join PMSCelsiusDB..BuyerTable bu on  m.BuyerId = bu.BuyerId
  join PMSCelsiusDB..Style_table s on m.StyleNo = s.StyleId
  ) Z on X.BarcodeNo = Z.BarcodePrimaryKey
  join
  (select distinct  OCNo,PurchaseOrderNumber,Color,Size,StyleName,StyleCode from PMSCelsiusDB..PurchaseOrderTable) P on X.StyleSubCat = P.StyleName and X.PoNumber =P.PurchaseOrderNumber
  and X.Color = P.Color and X.Size = P.Size and Z.StyleCode = P.StyleCode
  group by 
   X.StyleSubCat,Z.Stylecode, X.PoNumber,Z.Floor, X.Color,X.Size,X.BuyerName,P.OCNo`;
  //   console.log(sqlQuery);

  return new Promise((resolve, reject) => {
    request.query(sqlQuery, async function (err, result) {
      if (err) {
        console.log(err);
        reject("error");
      } else {
        console.log(
          "dailyKnittingProductionDay records pulled: " + result.rowsAffected
        );
        resolve(result.recordset);
      }
    });
  });
};

module.exports = {
  dailyKnittingIncentiveDay,
  dailyKnittingIncentiveNight,
  dailyLinkingIncentive,
  dailyKnittingProductionNightPreviousDay,
  dailyKnittingProductionNight,
  dailyKnittingProductionDay,
};
