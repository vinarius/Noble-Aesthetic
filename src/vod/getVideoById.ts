import { APIGatewayProxyEvent, S3CreateEvent } from 'aws-lambda';

import { setDefaultProps } from '../../lib/lambda';
import { validateEnvVars } from '../../lib/utils';
import { HandlerResponse } from '../../models/response';

const loginHandler = async (event: S3CreateEvent): Promise<HandlerResponse> => {
  validateEnvVars(['sourceS3BucketName', 'destinationS3BucketName']);
  console.log('Event:', JSON.stringify(event));
  
  // const s3InputKeys: string[] = event.Records.map(record => record.s3.object.key);



  return {
    success: true
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, loginHandler);

  console.log('Response:', response);
  return response;
}
