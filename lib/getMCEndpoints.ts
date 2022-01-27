import { CdkCustomResourceEvent } from 'aws-lambda';
import { retryOptions } from './utils';
import { HandlerResponse } from '../models/response';
import { MediaConvertClient, DescribeEndpointsCommand } from '@aws-sdk/client-mediaconvert';

// return type of Lambda function
interface GetMCEndpointsResponse extends HandlerResponse{
  Status: string,
  LogicalResourceId: string,
  StackId: string,
  RequestId: string,
  statusCode: number,
  PhysicalResourceId: string,
  Data?: {
    endpointUrl: string;
  }
}
  
const clientMediaConvert = new MediaConvertClient({ ...retryOptions });

// Lambda function that will be called by the Custom Resource
const describeEndPointHandler = async (event: CdkCustomResourceEvent): Promise<GetMCEndpointsResponse> => {
  const describeEndpointCommand = new DescribeEndpointsCommand({});
  const describeEndpoint = await clientMediaConvert.send(describeEndpointCommand);
  
  // Data - Contains result available to the CDK stack via getAtt method on the CustomResource object.
  return {
    success: true,
    Status: 'SUCCESS',
    statusCode: 200,
    LogicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    PhysicalResourceId: event.LogicalResourceId,
    Data: {
      endpointUrl: describeEndpoint.Endpoints![0].Url as string
    }
  };
};

export async function handler (event: CdkCustomResourceEvent): Promise<GetMCEndpointsResponse> {
  console.log('Event:', JSON.stringify(event));

  if (event.RequestType === 'Create') {
    const response = await describeEndPointHandler(event);
    console.log('Response:', response);
    return response;
  }

  return {
    success: true,
    Status: 'SUCCESS',
    statusCode: 200,
    LogicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    PhysicalResourceId: event.LogicalResourceId
  };
}
