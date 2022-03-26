/* eslint-disable @typescript-eslint/no-explicit-any */
import { WriteRequest } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommandOutput, DynamoDBDocument, GetCommand, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

export interface BatchPutWriteResponse {
  success: boolean;
  processedItemsCount: number;
  unprocessedItemsCount: number;
  unprocessedItems: { [key: string]: any; }[];
}

export interface DynamoScanItemsResponse { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function getItem(
  client: DynamoDBDocument,
  tableName: string,
  idKey: string,
  itemId: string
) {
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      [idKey]: itemId
    }
  });
  return await client.send(command);
}

export async function batchPutWrite(
  client: DynamoDBDocument,
  tableName: string,
  dynamoItems: { [key: string]: any; }[]
): Promise<BatchPutWriteResponse> {
  const batchesOutput: BatchWriteCommandOutput[] = [];
  let batch = [];
  let attempts = 0;
  let pendingItems: any = [...dynamoItems];
  let remainingItemsCount = pendingItems.length;
  const response = {
    success: true,
    processedItemsCount: 0,
    unprocessedItemsCount: 0,
    unprocessedItems: []
  };

  do {
    for (const item of pendingItems) {
      response.processedItemsCount++;

      if (batch.length < 25) {
        batch.push({
          PutRequest: {
            Item: item
          }
        });

        remainingItemsCount--;
      }

      if (batch.length === 25) {
        const batchWrite = await client.batchWrite({
          RequestItems: {
            [tableName]: batch
          }
        });

        batchesOutput.push(batchWrite);
        batch = [];
      }
    }

    if (batch.length > 0) {
      const batchWrite = await client.batchWrite({
        RequestItems: {
          [tableName]: batch
        }
      }).catch(error => {
        throw new Error(error.message);
      });

      batchesOutput.push(batchWrite);
      batch = [];
    }

    if (batchesOutput.some(batchOutput => Object.keys(batchOutput?.UnprocessedItems as any).length ?? 0 > 0)) {
      attempts++;

      const unprocessedItems = batchesOutput.flatMap(batchOutput => batchOutput?.UnprocessedItems?.[tableName].map((table: WriteRequest) => table.PutRequest?.Item));

      pendingItems = [ ...unprocessedItems ];
      remainingItemsCount = pendingItems.length;
      response.processedItemsCount -= unprocessedItems.length;
    }
  } while (remainingItemsCount > 0 && attempts < 10);

  if (remainingItemsCount > 0) {
    response.success = false;
    response.processedItemsCount -= pendingItems.length;
    response.unprocessedItemsCount = pendingItems.length;
    response.unprocessedItems = pendingItems;
  }

  return response;
}

export async function scan(
  client: DynamoDBDocument,
  tableName: string
): Promise<DynamoScanItemsResponse[]> {
  let nextToken;
  let totalData: DynamoScanItemsResponse[] = [];

  do {
    const response: ScanCommandOutput = await client.scan({
      TableName: tableName,
      ExclusiveStartKey: nextToken
    });

    totalData = [
      ...totalData,
      ...response.Items as DynamoScanItemsResponse[]
    ];

    nextToken = response.LastEvaluatedKey;
  } while (nextToken);

  return totalData;
}