# Sigsee Backend Infrastructure

## Table of Contents

1.  [Software Requirements](#1-software-requirements)
2.  [Project Operations](#2-project-operations)
3.  [App Entry Point](#3-app-entry-point)
4.  [Resource Naming](#4-resource-naming)
5.  [Instructions to Manually Deploy](#5-instructions-to-manually-deploy)
6.  [Useful Commands](#6-useful-commands)
7.  [Repository Layout](#7-repository-layout)
8.  [Exporting Values Between Stacks](#8-exporting-values-between-stacks)
9.  [Instructions For Credentials](#9-instructions-for-credentials)
10. [Architecture Diagram](#10-architecture-diagram)
11. [Useful Links](#11-useful-links)

## 1. Software Requirements
- node v14
- npm v8

I recommend using [nvm](https://github.com/nvm-sh/nvm) to manage your installation(s) of Nodejs. Alternatively, you may [download directly](https://nodejs.org/en/).

Node 14 by default comes bundled with npm v6. You can upgrade this using the following command:

```bash
npm i -g npm@8
```

## 2. Project Operations

The Sig Backend operates in two AWS accounts: sigsee-dev and sigsee-prod.
The prod account is used exclusively for production resources. The dev account is used for shared resources that all team members
use for testing and is also used for deploying isolated resources for new features or bugfixes. The dev and prod accounts used a one-time, manual deployment using the [CDK Toolkit](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) with the command:

```bash
npm run deploy
```

This process sets up a CodeBuild project (stacks/CICD-stack.ts) that automates the deployment process on every pull request merge. For this reason, the common dev and prod stacks will not require manual deployment when new AWS resources are added, modified, or removed. The buildspec.yml located at the source root determines how the CodeBuild project operates. The master branch targets the production environment. The develop branch targets the dev environment. Any other branch deploys isolated resources into the sigsee-dev account. Developers cannot push directly to develop or master, but must develop new work on a feature branch and submit their changes to be merged via pull request.

The order should follow:
1. feature/sigsee-***
2. develop
3. master

Merging a pull request from develop to master triggers the automated deployment in the sigsee-prod account and is considered a release.

When creating a feature branch, this project follows conventional branch naming based on the Jira task. For example, when a new Jira task is created to deploy a lambda function - create a new branch in the following format:

```bash
git branch feature/sigsee-361
```

If you are working on a new AWS resource or changing the current configuration, follow the [Instructions to manually deploy](#instructions-to-manually-deploy). This will deploy AWS resources specific to your feature branch so you can test safely without breaking what is used for testing for the team.

## 3. App Entry Point

All AWS CDK applications contain a cdk.json at the root of the CDK project. The cdk.json's app property defines the entry point of the application. For this project, it is bin/infrastructure.ts. The CDK is very flexible and gives complete control over how the code is executed. Whether we run `npm run synth`, `npm run deploy`, or any other command that executes the code, cdk.json.app will be the entry point.

## 4. Resource Naming

Resources should follow this naming convention:

```js
`${project}-myResource-${stage}`
```

These template literal strings leverage the power of JavaScript and are what allows us the ability to create ephemeral resources. The stage variable is based on the BRANCH environment variable, or else `git status` is run to attempt to determine the current configuration. This functionality can be found in lib/utils.ts under the getAppConfig function.

## 5. Instructions to Manually Deploy

```bash
git clone <url>
npm install
npm run aws-token sigsee-dev <your-mfa-token>
npm run deploy
```

Running the `aws-token` script will require setting up a shared AWS profile. Please see your team AWS admin if you need help setting up an AWS access key.

This process will deploy every stack that is included in this app (bin/infrastructure.ts).

If for any reason you only want to deploy a single stack (and its dependent stacks) you can run the following command.

```bash
STACK='stackName1' npm run deploy
```

If a CDK application includes multiple stacks and we want to explicitly mention the stack, we can pass the stack ids as arguments as shown below:

```bash
STACK='stackName1 stackName2' npm run synth
STACK='stackName1 stackName2' npm run deploy
```

Where stackName1, stackName2 are the stack ids of the stack. The arguments also accept wildcards, so passing * will run the command for all stacks. We can do pattern-matching using wildcards by providing the wildcard characters:

- ?: wildcard to match a single character
- *: wildcard to match many characters

For example, if we want to publish all stacks starting with lambda, the command will be as shown below:

```bash
STACK='lambda*' npm run synth
STACK='lambda*' npm run deploy
```

## 6. Useful Commands

- `npm run build` compile typescript to js.
- `npm run deploy` Deploy all stacks to AWS account/region based on current git branch.
- `npm run clean` Recursively removes the dist, cdk.out, coverage directories and removes all non-vital .js files.
- `npm run destroy` Used to easily cleanup feature branch resources. Destroys all resources by default, or takes a STACK environment variable.
    Separate stacks with a space.
- `npm run synth` Emits the synthesized CloudFormation template.
- `npm run diff` Compare deployed stack(s) with the current state.
- `npm run test` Perform the jest unit tests.
- `npm run lint` Run linting on source code.
- `npm run watch` Watch for changes and compile.
- `npm run aws-token` Set temporary mfa credentials "{profile}-token" (ie sigsee-dev-token).
- `npm run generate-diagram` Generate a new architecture diagram based on the source code.

## 7. Repository Layout

```
bin/                 # Scripts and functions that can be run directly, or by the package.json
                         scripts. Includes the main cdk app - infrastructure.ts.
lib/                 # Shared helper classes and functions.
models/              # Shared types and runtime validation functions are defined here.
src/                 # Where the code lives for all lambda functions.
stacks/              # Cdk stacks and constructs. Here is where infrastructure resources are
                         defined and configured.
test/                # Tests to run against infrastructure stacks.
.eslintignore        # Defines which files are ignored by eslint.
.eslintrc.js         # Defines the linting strategy used by eslint.
.gitignore           # Defines which files are kept out of the remote repository,
                         such as node_modules.
.npmignore           # Defines which files should be omitted when publishing the package
                         to a registry.
cdk.context.json     # The AWS CDK caches context values retrieved from the AWS account.
                         This practice avoids unexpected changes to the deployments when,
                         for example,a new Amazon Linux AMI is released, changing the
                         Auto Scaling group.
cdk.json             # Defines where the main entry point of the CDK application is, and is
                         used to cache context key-value pairs in addition to cdk.context.json.
config.ts            # Environment/system configuration. Most props passed down to the stacks
                         are defined here.
jest.config.js       # Defines the testing strategy used by Jest. This repository aims for a
                         minimum of 80% code coverage. Use the `npm t -- --silent` command for
                         less verbose console output.
package.json         # Defines the package structure, commands, dependencies, and publishing
                         strategy. Note the scripts section.
README.md            # Defines this guide.
swagger.yml          # Defines the api documentation for Sigsee.
tsconfig.build.json  # An extension of tsconfig.json - defines how TypeScript builds this project.
tsconfig.json        # Defines how Typescript compiles this project.

----------------

cdk.out/             # Auto-generated by the AWS CDK. You can find synthesized, native
                        CloudFormation templates in here from `npm run synth` or `npm run deploy`.
coverage/            # Auto-generated by the Jest testing framework. You can find details on code
                         coverage as of the latest test here.
dist/                # Auto-generated. Where the latest build is found, both source code of the
                         lambdas as well as the lambdaLayer's dependencies.
node_modules/        # Generated by npm when you run `npm install`.
```

Configuration files are stored at the root and code always lives in a folder to promote reusablity and modularization. Runtime code (typically lambda functions) that gets deployed to the cloud lives in `/src`. It gets transpiled using esBuild versus code that is intended to be run locally on the dev box. Code for helping deployment, or for infrastructure is generally split. If the file is intended to be run directly, it lives in `/bin`. If the file is run indirectly (renaming when deploying to aws, for instance) it belongs in `/lib`. Usually this happens when a `/bin` script gets too big and needs to be modularized. The helpers end up being code that is not intended to be called directly from the command line, but also does not get uploaded/run in production.

Name your stacks! Don't let Cloudformation autogenerate your naming.

## 8. Exporting Values Between Stacks
Use the AWS Systems Manager Parameter Store (SSM Parameters) to export your stack values when they are needed among other stacks. Native Cloudformation has a low level import/export feature, but this leads to tearing down consuming stacks when the exported value in the producing stack changes. This can lead to issues when the consuming stack contains stateful resources such as a database or user pool. Using SSM parameters is a much more flexible option that eliminates tearing down stacks. The logical and physical ids must be consistent between the producing and consuming stack.

## 9. Instructions For Credentials

Your developer credentials are designed to be stored in `~/.aws/credentials` after being created on the console. It'll work smoothly across any number of accounts, and with token mfa, as long as we take care of a few small things. When naming your credentials profile, use the same name as the aws account alias. So, if the login portal alias is 'sigsee-dev' name your credentials alias the same in `~/.aws/credentials` like:

```
[sigsee-dev]
aws_access_key_id=******************
aws_secret_access_key=******************
```

Wtih mfa, the script will instead look for a temporary set of credentials to use. If the account alias, and your profile alias, are `sigsee-dev` the script will attempt to get a temporary set of token including the session token on the credentials profile `sigsee-dev-token` like this:

```
[sigsee-dev]
aws_access_key_id=******************
aws_secret_access_key=******************

[sigsee-dev-token]
aws_access_key_id=******************
aws_secret_access_key=******************
aws_session_token=******************
```

To generate a session token I have created a script. To use the script to create a named profile appending `-token`, invoke the npm script aws-token in the format: `npm run aws-token {profile} {token}`

```
npm run aws-token sigsee-dev 123456
```
This will produce the following output:

```
Set session token in profile sigsee-dev-token, expires 10/17/2021 01:10 EDT
```

This command (if your mfa token is valid) will create the named profile sigsee-dev-token for you.

The script inserts the valid token into our `~/.aws/credentials` on the `sigsee-dev-token` alias.


If you would rather not use this utility, you can [use the aws cli](https://docs.aws.amazon.com/cli/latest/reference/sts/get-session-token.html):

```
aws sts get-session-token
```

## 10. Architecture Diagram
![Architecture Diagram](docs/architecture-diagram.png)

## 11. Useful Links

1. [AWS SDK V3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html)
2. [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html)
3. [AWS CLI Documentation](https://awscli.amazonaws.com/v2/documentation/api/latest/index.html)
4. [AWS Cloudformation Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)
