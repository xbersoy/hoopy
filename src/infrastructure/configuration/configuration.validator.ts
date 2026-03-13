import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

const validateConfig = (config: Record<string, unknown>) => {
  const compactConfig = compact(config);
  const missingVars = checkMissingVars(compactConfig);
  if (missingVars.length > 0) {
    throw new Error('Missing following ENVs: \n' + missingVars.join(', '));
  }
  return compactConfig;
};

const checkMissingVars = (config: Record<string, unknown>) => {
  const configKeys = Object.keys(config);
  const requiredKeys = Object.keys(dotenv.parse(readFileSync('.env.example')));
  const missingKeys = requiredKeys.filter((a) => configKeys.indexOf(a) < 0);
  return missingKeys;
};

const compact = (obj) => {
  const result = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key]) {
      result[key] = obj[key];
    }
  });
  return result;
};

export { validateConfig };
