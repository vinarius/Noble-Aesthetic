/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyEvent } from 'aws-lambda';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
};

export async function setDefaultProps(
  event: APIGatewayProxyEvent,
  handler: any,
  context?: any,
  customHeaders?: any
): Promise<any> {
  try {
    const response = await handler(event, context);
    return {
      statusCode: 200,
      headers: customHeaders ?? headers,
      body: typeof response === 'string' ? response : JSON.stringify(response)
    };
  } catch (error: any) {
    console.error(error);

    const errorTemplate = {
      success: false,
      error: ''
    };

    if (error instanceof Error) {
      errorTemplate.error = `${error.name && `${error.name}: `}${error.message}`;
    }

    const body = typeof error === 'string' ? error :
      error instanceof Error ? JSON.stringify(errorTemplate) :
        JSON.stringify(error);

    return {
      statusCode: error.statusCode ?? 500,
      headers,
      body
    };
  }
}
