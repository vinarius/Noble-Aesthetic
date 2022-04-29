/* eslint-disable @typescript-eslint/no-explicit-any */

import { LoggerFactory } from '../lib/loggerFactory';

export const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
};

const logger = LoggerFactory.getLogger();

export async function setDefaultProps(
  event: any,
  handler: any,
  context?: any
): Promise<any> {
  try {
    const response = await handler(event, context) ?? {};
    const customHeaders = response.customHeaders;
    const customSuccess = response.success;
    delete response.customHeaders;
    delete response.success;

    console.log('testing lambda response:', response);

    return {
      statusCode: 200,
      headers: customHeaders ?? headers,
      body: JSON.stringify({
        success: customSuccess ?? true,
        ...Object.keys(response).length > 0 && { payload: response }
      })
    };
  } catch (error: any) {
    console.log('testing lambda error:', error);

    // TODO: fix error handling

    logger.warn(error);

    return {
      statusCode: error.statusCode ?? error.$metadata?.httpStatusCode ?? 500,
      headers,
      body: JSON.stringify({
        ...error,
        success: false
      })
    };
  }
}
