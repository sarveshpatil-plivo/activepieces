import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { plivoAuth } from '../..';

export const plivoLookupNumber = createAction({
  auth: plivoAuth,
  name: 'lookup_number',
  description: 'Look up carrier, country, and line type for a phone number',
  displayName: 'Lookup Number',
  props: {
    number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to look up, in E.164 format (e.g., +14155551234)',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      description: 'The type of information to retrieve',
      required: false,
      defaultValue: 'carrier',
      options: {
        options: [
          { label: 'Carrier', value: 'carrier' },
        ],
      },
    }),
  },
  async run(context) {
    const { number, type } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://lookup.plivo.com/v1/Number/${encodeURIComponent(number)}`,
      queryParams: { type: type ?? 'carrier' },
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.username,
        password: context.auth.password,
      },
    });
    return response.body;
  },
});
