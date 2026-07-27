import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi, plivoCommon } from '../common';
import { plivoAuth } from '../..';

export const plivoMakeCall = createAction({
  auth: plivoAuth,
  name: 'make_call',
  description: 'Place an outbound call that runs answer XML from a URL',
  displayName: 'Make Call',
  props: {
    from: plivoCommon.phone_number,
    to: Property.ShortText({
      displayName: 'To',
      description: 'The phone number to call, in E.164 format (e.g., +14155551234)',
      required: true,
    }),
    answer_url: Property.ShortText({
      displayName: 'Answer URL',
      description:
        'A URL that returns Plivo answer XML when the call is answered. Plivo fetches this to control the call.',
      required: true,
    }),
    answer_method: Property.StaticDropdown({
      displayName: 'Answer Method',
      description: 'The HTTP method Plivo uses to request the answer URL',
      required: false,
      defaultValue: 'POST',
      options: {
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' },
        ],
      },
    }),
  },
  async run(context) {
    const { from, to, answer_url, answer_method } = context.propsValue;
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callPlivoApi(
      HttpMethod.POST,
      'Call/',
      { auth_id, auth_token },
      {
        from,
        to,
        answer_url,
        answer_method: answer_method ?? 'POST',
      }
    );
    return response.body;
  },
});
