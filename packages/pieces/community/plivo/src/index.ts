import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { plivoSendSms } from './lib/action/send-sms';
import { plivoMakeCall } from './lib/action/make-call';
import { plivoLookupNumber } from './lib/action/lookup-number';
import { plivoNewIncomingSms } from './lib/trigger/new-incoming-sms';
import { plivoNewIncomingCall } from './lib/trigger/new-incoming-call';

export const plivoAuth = PieceAuth.BasicAuth({
  description: 'The authentication to use to connect to Plivo',
  required: true,
  username: {
    displayName: 'Auth ID',
    description: 'The Auth ID from your Plivo console',
  },
  password: {
    displayName: 'Auth Token',
    description: 'The Auth Token from your Plivo console',
  },
});

export const plivo = createPiece({
  displayName: 'Plivo',
  description:
    'Cloud communications platform for building SMS, Voice and Messaging applications',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/plivo.png',
  auth: plivoAuth,
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    plivoSendSms,
    plivoMakeCall,
    plivoLookupNumber,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.plivo.com/v1',
      auth: plivoAuth,
      authMapping: async (auth) => {
        const basicAuth = auth as { username: string; password: string };
        return {
          Authorization: `Basic ${Buffer.from(
            `${basicAuth.username}:${basicAuth.password}`
          ).toString('base64')}`,
        };
      },
    }),
  ],
  authors: ['sarveshpatil-plivo'],
  triggers: [plivoNewIncomingSms, plivoNewIncomingCall],
});
