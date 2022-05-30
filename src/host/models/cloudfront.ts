export interface cfEventRequest {
  Records: [
    {
      cf: {
        config: {
          distributionDomainName: string,
          distributionId: string,
          eventType: string,
          requestId: string
        },
        request: {
          body: {
            action: string,
            data: string,
            encoding: string,
            inputTruncated: boolean
          },
          clientIp: string,
          headers: {
            host: [
              {
                key: string,
                value: string
              }
            ],
            'user-agent': [
              {
                key: string,
                value: string
              }
            ],
            accept: [
              {
                key: string,
                value: string
              }
            ],
            'accept-encoding': [
              {
                key: string,
                value: string
              }
            ],
            'accept-language': [
              {
                key: string,
                value: string
              }
            ]
          },
          method: string,
          querystring: string,
          uri: string
        }
      }
    }
  ]
}

export interface cfEventResponse {
  status: number,
  headers: {
    'set-cookie': {
      key: string,
      value: string
    }[]
  },
  body: string
}

export interface cfBasicResponse {
  status: number,
  body: string
}