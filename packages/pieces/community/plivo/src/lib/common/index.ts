import { Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { plivoAuth } from '../..';

export const plivoCommon = {
  phone_number: Property.Dropdown({
    auth: plivoAuth,
    description: 'The Plivo number to use',
    displayName: 'From',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }

      const basicAuth = auth as { username: string; password: string };
      const response = await callPlivoApi<{
        objects: { number: string; alias: string }[];
      }>(HttpMethod.GET, 'Number/', {
        auth_id: basicAuth.username,
        auth_token: basicAuth.password,
      });
      return {
        disabled: false,
        options: response.body.objects.map((number) => ({
          value: number.number,
          label: number.alias ? `${number.number} (${number.alias})` : number.number,
        })),
      };
    },
  }),
};

export const callPlivoApi = async <T extends HttpMessageBody>(
  method: HttpMethod,
  path: string,
  auth: { auth_id: string; auth_token: string },
  body?: unknown
) => {
  return await httpClient.sendRequest<T>({
    method,
    url: `https://api.plivo.com/v1/Account/${auth.auth_id}/${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.auth_id,
      password: auth.auth_token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
};
