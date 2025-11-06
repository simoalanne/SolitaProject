import { FinancialDataSchema, validateInput } from "@myorg/shared";

/**
 * This function can be used to parse financial statistics user pasted from kauppalehti.fi
 * @param copyPastedFinancialStats - The raw text copied from kauppalehti.fi
 * @returns An object containing arrays of revenues and profits for the last 5 years.
 */
const parseKauppalehtiData = (copyPastedFinancialStats: string) => {
  const rows = copyPastedFinancialStats
    .split("\n")
    // The kauppalehti data has non standard minus sign character (U+2212) which parseFloat cannot handle correctly
    .map((row) => row.replaceAll(" ", "").replaceAll("\u2212", "-").toLowerCase());
  const getFiveAfter = (previousRowKey: "liikevaihto" | "liiketulos") => {
    const keyIndex = rows.findIndex((row) => row.startsWith(previousRowKey));
    const values = rows.slice(keyIndex + 1, keyIndex + 6);
    // if the number is large then it will contain "milj" at the end
    return values.map((val) => {
      if (val.endsWith("milj")) {
        return parseFloat(val.replace("milj", "")) * 1_000_000;
      }
      return parseFloat(val);
    });
  };

  const data = {
    revenues: getFiveAfter("liikevaihto"),
    profits: getFiveAfter("liiketulos"),
  };

  const validation = validateInput(data, FinancialDataSchema);
  return validation.errors ? undefined : data; 
};

export default parseKauppalehtiData;
