import fs from "fs";
import fetch from "node-fetch";

import { parse } from "@fast-csv/parse";

const CWD = process.cwd();
const CONFIG_PATH = `${CWD}/sheets.json`;
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const { sheets } = CONFIG.google;

async function getAndWriteSheet(sheet) {
  const base = "https://docs.google.com/spreadsheets/d/e";
  const url = `${base}/${sheet.id}/pub?gid=${sheet.gid}&single=true&output=csv`;

  const file_csv = `${CWD}/${sheet.filepath || "src/data/data.csv"}`;
  const file_json = file_csv.replace(".csv", ".json");

  try {
    const response = await fetch(url);

    if (response.ok) {
      const data_csv = await response.text();
      const file_csv_write = fs.writeFile(file_csv, data_csv, (err) => {
        if (err) throw err;
        console.log(
          "csv with id",
          "\x1b[32m",
          `${sheet.id}`,
          "\x1b[0m",
          "and gid",
          "\x1b[32m",
          `${sheet.gid}`,
          "\x1b[0m",
          "successfully written to",
          "\x1b[34m",
          `${file_csv}\n`
        );
      });

      // const data_json = [];
      const data_json = {};
      const file_json_write = await parse({ headers: true })
        .validate((data) => {
          let dataIsValid = true;
          // let validation = {};

          // console.log(data["id"]);
          sheet.required.forEach((key) => {
            if (data[key] === "") {
              dataIsValid = false;
              // validation[key] = false;
            }
          });
          // console.log(validation);

          return dataIsValid;
        })
        .on("error", (error) => console.error(error))
        .on("data", (row) => {
          // console.log(row);
          // data_json.push(row);
          data_json[row.id] = row;
        })
        .on("end", (rowCount) => {
          // console.log(data_json);
          fs.writeFile(file_json, JSON.stringify(data_json), (err) => {
            if (err) throw err;
            console.log(
              "json with id",
              "\x1b[32m",
              `${sheet.id}`,
              "\x1b[0m",
              "and gid",
              "\x1b[32m",
              `${sheet.gid}`,
              "\x1b[0m",
              "successfully written to",
              "\x1b[34m",
              `${file_json}\n`
            );
          });
        });
      file_json_write.write(data_csv);
      file_json_write.end();

      Promise.all([file_csv_write, file_json_write]).then(() => {
        // console.log("complete");
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function init() {
  sheets.forEach((sheet) => getAndWriteSheet(sheet));
}

init();
