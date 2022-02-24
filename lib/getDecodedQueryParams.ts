import { Generic } from '../models/cloudResources';

export function getDecodedQueryParams(params: Generic = {}) {
  const decodedParams: Generic = {};

  for (const [key, value] of Object.entries(params)) {
    decodedParams[key] = decodeURIComponent(value);
  }

  return decodedParams;
}