import { APIGatewayProxyEvent, S3CreateEvent } from 'aws-lambda';

import { setDefaultProps } from '../../lib/lambda';
import { validateEnvVars, retryOptions } from '../../lib/utils';
import { HandlerResponse } from '../../models/response';
import { MediaConvertClient, CreateJobCommand, CreateJobCommandInput, GetJobTemplateCommand, GetJobTemplateCommandInput } from '@aws-sdk/client-mediaconvert';
import * as _ from 'lodash';

const {
  roleName = '',
  endpoint = '',
  destinationS3BucketName = ''
} = process.env;

const clientMediaConvert = new MediaConvertClient({ ...retryOptions, endpoint });

const getMp4Group = (outputPath: string) => ({
  Name: 'File Group',
  OutputGroupSettings: {
    Type: 'FILE_GROUP_SETTINGS',
    FileGroupSettings: {
      Destination: `${outputPath}/mp4/`
    }
  },
  Outputs: []
});

const getHlsGroup = (outputPath: string)  => ({
  Name: 'HLS Group',
  OutputGroupSettings: {
    Type: 'HLS_GROUP_SETTINGS',
    HlsGroupSettings: {
      SegmentLength: 5,
      MinSegmentLength: 0,
      Destination: `${outputPath}/hls/`
    }
  },
  Outputs: []
});

const getDashGroup = (outputPath: string) => ({
  Name: 'DASH ISO',
  OutputGroupSettings: {
    Type: 'DASH_ISO_GROUP_SETTINGS',
    DashIsoGroupSettings: {
      SegmentLength: 30,
      FragmentLength: 3,
      Destination: `${outputPath}/dash/`
    }
  },
  Outputs: []
});

const getCmafGroup = (outputPath: string) => ({
  Name: 'CMAF',
  OutputGroupSettings: {
    Type: 'CMAF_GROUP_SETTINGS',
    CmafGroupSettings: {
      SegmentLength: 30,
      FragmentLength: 3,
      Destination: `${outputPath}/cmaf/`
    }
  },
  Outputs: []
});

const getMssGroup = (outputPath: string) => ({
  Name: 'MS Smooth',
  OutputGroupSettings: {
    Type: 'MS_SMOOTH_GROUP_SETTINGS',
    MsSmoothGroupSettings: {
      FragmentLength: 2,
      ManifestEncoding: 'UTF8',
      Destination: `${outputPath}/mss/`
    }
  },
  Outputs: []
});

// This logic could be used to get the thumbnail of the video image.
// const getFrameGroup = (outputPath: string) => ({//event, outputPath: string) => ({
//   CustomName: 'Frame Capture',
//   Name: 'File Group',
//   OutputGroupSettings: {
//     Type: 'FILE_GROUP_SETTINGS',
//     FileGroupSettings: {
//       Destination: `${outputPath}/thumbnails/`
//     }
//   },
//   Outputs: [{
//     NameModifier: '_thumb',
//     ContainerSettings: {
//       Container: 'RAW'
//     },
//     VideoDescription: {
//       ColorMetadata: 'INSERT',
//       AfdSignaling: 'NONE',
//       Sharpness: 100,
//       Height: 80, //event.frameHeight,
//       RespondToAfd: 'NONE',
//       TimecodeInsertion: 'DISABLED',
//       Width: 80, //event.frameWidth,
//       ScalingBehavior: 'DEFAULT',
//       AntiAlias: 'ENABLED',
//       CodecSettings: {
//         FrameCaptureSettings: {
//           MaxCaptures: 10000000,
//           Quality: 80,
//           FramerateDenominator: 5,
//           FramerateNumerator: 1
//         },
//         Codec: 'FRAME_CAPTURE'
//       },
//       DropFrameTimecode: 'ENABLED'
//     }
//   }]
// });

const createJobHandler = async (event: S3CreateEvent): Promise<HandlerResponse> => {
  validateEnvVars([
    'destinationS3BucketName',
    'roleName',
    'endpoint'
  ]);

  const s3InputKeys: string[] = event.Records.map(record => {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    return `s3://${bucket}/${key}`;
  });
  

  const createJobPromises = [];

  for (const inputPath of s3InputKeys) {
    // TODO: fix category naming later
    const outputPath = `s3://${destinationS3BucketName}/example-category/`;
    const mp4 = getMp4Group(outputPath);
    const hls = getHlsGroup(outputPath);
    const dash = getDashGroup(outputPath);
    const cmaf = getCmafGroup(outputPath);
    const mss = getMssGroup(outputPath);
    // const frameCapture = getFrameGroup(outputPath);

    const getJobTemplateInput: GetJobTemplateCommandInput = {
      Name: 'System-Ott_Hls_Ts_Avc_Aac'
    };

    const job: CreateJobCommandInput = {
      Role: roleName,
      JobTemplate: 'System-Ott_Hls_Ts_Avc_Aac',
      Settings: {
        Inputs: [{
          AudioSelectors: {
            'Audio Selector 1': {
              Offset: 0,
              DefaultSelection: 'NOT_DEFAULT',
              ProgramSelection: 1
            }
          },
          VideoSelector: {
            ColorSpace: 'FOLLOW',
            Rotate: '0'
          },
          FilterEnable: 'AUTO',
          PsiControl: 'USE_PSI',
          FilterStrength: 0,
          DeblockFilter: 'DISABLED',
          DenoiseFilter: 'DISABLED',
          TimecodeSource: 'EMBEDDED',
          FileInput: inputPath
        }],
        OutputGroups: []
      }
    };

    const tmpl = await clientMediaConvert.send(new GetJobTemplateCommand(getJobTemplateInput));

    for (const group of tmpl.JobTemplate!.Settings!.OutputGroups!) {
      let defaultGroup = {};

      switch(group?.OutputGroupSettings?.Type) {
        case 'FILE_GROUP_SETTINGS':
          defaultGroup = mp4;
          break;
        case 'HLS_GROUP_SETTINGS':
          defaultGroup = hls;
          break;
        case 'DASH_ISO_GROUP_SETTINGS':
          defaultGroup = dash;
          break;
        case 'MS_SMOOTH_GROUP_SETTINGS':
          defaultGroup = mss;
          break;
        case 'CMAF_GROUP_SETTINGS':
          defaultGroup = cmaf;
          break;
        default:
          throw {
            error: `InvalidFormatException: Type ${group?.OutputGroupSettings?.Type} not supported`
          };
      }

      console.log(`${group.Name} found in Job Template`);
      const outputGroup = _.merge(defaultGroup, group);

      // Add the output template structure to the main job template.
      job?.Settings?.OutputGroups?.push(outputGroup);
    }

    const createJobPromise = clientMediaConvert.send(new CreateJobCommand(job));
    createJobPromises.push(createJobPromise);
  }
  
  await Promise.all(createJobPromises);
  
  return {
    success: true
  };
};

export async function handler (event: APIGatewayProxyEvent) {
  console.log('Event:', JSON.stringify(event));

  const response = await setDefaultProps(event, createJobHandler);

  console.log('Response:', response);
  return response;
}
