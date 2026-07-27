import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi, plivoCommon } from '../common';
import { plivoAuth } from '../..';

export const plivoSendSms = createAction({
  auth: plivoAuth,
  name: 'send_sms',
  description: 'Send a new SMS message',
  displayName: 'Send SMS',
  props: {
    from: plivoCommon.phone_number,
    to: Property.ShortText({
      displayName: 'To',
      description: 'The phone number to send the message to, in E.164 format (e.g., +14155551234)',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message Body',
      description: 'The body of the message to send',
      required: true,
    }),
  },
  async run(context) {
    const { from, to, text } = context.propsValue;
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callPlivoApi(
      HttpMethod.POST,
      'Message/',
      { auth_id, auth_token },
      {
        src: from,
        dst: to,
        text,
      }
    );
    return response.body;
  },
});
