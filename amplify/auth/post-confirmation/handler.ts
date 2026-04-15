import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { env } from "$amplify/env/post-confirmation";

import type { Schema } from "../../data/resource";

// Configure Amplify with API endpoint + IAM auth
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
        region: env.AWS_REGION,
        defaultAuthMode: "iam",
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            sessionToken: env.AWS_SESSION_TOKEN,
          },
        }),
        clearCredentialsAndIdentityId: () => {},
      },
    },
  }
);

// Generate typed GraphQL client
const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  try {
    await client.models.UserProfile.create({
      email: userAttributes.email,
      profileOwner: userAttributes.sub, // Cognito user ID
    });

    console.log("UserProfile created for:", userAttributes.email);
  } catch (error) {
    console.error("Error creating UserProfile:", error);
    throw error;
  }

  return event;
};