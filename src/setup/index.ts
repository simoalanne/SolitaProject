import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const now = Date.now(); // for measuring execution time

const fetchFromBFServer = async () => {
  // fetches a csv file from businessfinland.fi and converts it to json file containing
  // only the important parts. Since there is no api to get it from it's done the
  // hard way with browser automation.
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://tietopankki.businessfinland.fi/anonymous/extensions/fundingawarded/fundingawarded.html",
    { waitUntil: "networkidle" }
  );

  // The button which has the scope needed is on the Customers tab
  await page.locator("text=Customers").click();

  const csvContent = await page.evaluate(async () => {
    const btn = document.querySelector("button.csv");
    // the target function is in angular scope which belongs to the button
    const scope = (window as any).angular.element(btn).scope();

    // patch the scope to return csv content instead of opening a new tab
    scope.exportCSV = async () => {
      // copy-pasted from original source code
      const file = await scope.ext.model.exportData(
        "CSV_C",
        "/qHyperCubeDef",
        "filename",
        true
      );
      const qUrl = file.result ? file.result.qUrl : file.qUrl;
      const fullUrl = scope.getBasePath() + qUrl;
      // changed to fetch instead of opening a new tab
      const res = await fetch(fullUrl);
      return await res.text();
    };

    return await scope.exportCSV();
  });
  await browser.close();
  return csvContent;
};


let csvContent = null;
try {
  csvContent = fs.readFileSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../data-analysis/BFData.csv"
    ),
    "utf-8"
  );
} catch {
  console.log("No local CSV file found, fetching from Business Finland server...");
}

csvContent ??= await fetchFromBFServer();


export type FundingEntry = { year: number; amount: number; isLoan: boolean };
export type FundingData = Record<string, FundingEntry[]>;

const json: FundingData = csvContent
  .split("\n")
  .slice(1)
  .reduce((acc: FundingData, csvRow: string) => {
    const allFields = csvRow.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!allFields) return acc;

    const businessId = allFields[1];
    const year = Number(allFields[2]);
    if (!year) return acc;

    const amount = Number(allFields[7].replace(/\s/g, "")) || 0;
    if (!amount) return acc;

    // Determine funding type: its a loan if the grant amount is zero
    const isLoan = Number(allFields[3].replace(/\s/g, "")) === 0;

    if (!acc[businessId]) acc[businessId] = [];
    acc[businessId].push({ year, amount, isLoan });

    return acc;
  }, {} as FundingData);


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.resolve(
  __dirname,
  "../backend/src/assets/businessFinlandFundingData.json"
);
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(json), "utf-8");
console.log(`Data written to ${outputFile} in ${(Date.now() - now) / 1000}s`);
