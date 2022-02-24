export function validateQueryParams(params: string[], expectedParams: string[]) {
  const notFoundParams: string[] = [];
  const foundParams: string[] = [];

  const lowerCaseExpected = expectedParams.map(param => param.toLowerCase());

  for (const key of params) {
    if (lowerCaseExpected.includes(key.toLowerCase())) {
      foundParams.push(key);
    } else {
      notFoundParams.push(key);
    }
  }

  return {
    isValidParams: notFoundParams.length === 0,
    foundParams,
    notFoundParams
  };
}