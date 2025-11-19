const parseFinancialData = (financialData: string) => {
    const lines = financialData
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

    const result = [];
    let currentTitle = null;
    let currentValues: string[] = [];

    // Regex checks if line starts with minus symbol or a number
    const isValue = (line: string) => /^[\d\-−]/.test(line);

    for (const line of lines) {
        if (!isValue(line)) {
            if (currentTitle != null && currentValues.length > 0) {
                result.push({ title: currentTitle, values: currentValues })
            }

            currentTitle = line;
            currentValues = [];
        } else {
            currentValues.push(line);
        }
    }

    if (currentTitle != null && currentValues.length > 0) {
        result.push({ title: currentTitle, values: currentValues });
    }

    return result;
}

export const FinancialDataTable = ({ financialData }: { financialData: string }) => {
    const parsedData = parseFinancialData(financialData);

    return (
    <table className="financialDataTable">
      <tbody>
        {parsedData.map((row, i) => (
          <tr key={i}>
            <th>
              {row.title}
            </th>
            {row.values.map((value, j) => (
                <td key={j}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}