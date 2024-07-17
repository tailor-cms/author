# Deploy with Pulumi

This section guides you through deploying infrastructure using Pulumi with
AWS as the cloud provider. Pulumi allows provisioning infrastructure using
code, making it easier to create, manage, and update cloud resources.

## Prerequisites

- Ensure you have both the Pulumi CLI and AWS CLI installed on your machine.
- Confirm that you are signed into both the Pulumi and AWS.
- Ensure you have [jq](https://formulae.brew.sh/formula/jq) installed

## Steps for Deployment

1. **Navigate to the Infrastructure Directory**: Change your current directory
   to the `infrastructure` folder by executing `cd infrastructure` in your
   terminal.

2. **Initialize the Stack**:

   - If you haven't already created a Pulumi stack, you can do so by
     running `pulumi stack init <stack_name>`. Replace `<stack_name>` with a
     name of your choice for the stack.
   - Ensure that AWS SSM parameters are correctly set up.
     For more information on the required environment variables, refer to the
     `/infrastructure/src/env.ts` file.

3. **Configure the `TAILOR_DOCKER_IMAGE` Environment Variable**:
   For example, use the command 
   `export TAILOR_DOCKER_IMAGE=ghcr.io/tailor-cms/author:sha-4fa2c1b` to define 
   the Docker image to be used. A GitHub workflow is 
   configured to automatically build and publish Docker images
   upon any merge into the `main` branch. This ensures that the latest version
   of the code is always available as a Docker image for deployment.

4. **Deploy with Pulumi**:
   Execute `pulumi up` to start the deployment process. This command provisions
   your infrastructure on AWS according to the definitions in your Pulumi
   scripts. You will be shown a preview of the changes that Pulumi plans to
   make, and you can confirm to proceed with the deployment.

5. **Connect to cluster**
   ```sh
   aws ecs execute-command  \
   --cluster your-cluster \
   --task $(aws ecs list-tasks --your-cluster | jq -r '.taskArns[0] | split("/")[2]') \
   --command "/bin/sh" \
   --interactive
   ```

6. **Migrate the database**

    ```sh
    pnpm db:migrate
    ```

7. **Invite admin**

    ```sh
    cd apps/backend
    pnpm invite:admin admin@example.com
    ```

:::tip Note 👆
Remember to review the configurations and parameters within the
`/infrastructure/src/env.ts` file carefully before proceeding with the
deployment to ensure that your infrastructure is set up correctly.
:::
