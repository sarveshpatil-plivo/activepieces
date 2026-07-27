import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi, plivoCommon } from '../common';
import { plivoAuth } from '../..';

interface LastMessage {
  lastMessageId: string | null;
}

interface MessagePaginationResponse {
  objects: {
    message_uuid: string;
    from_number: string;
    to_number: string;
    message_direction: string;
  }[];
}

const STORE_KEY = '_new_incoming_sms_trigger';

export const plivoNewIncomingSms = createTrigger({
  auth: plivoAuth,
  name: 'new_incoming_sms',
  displayName: 'New Incoming SMS',
  description: 'Triggers when a new SMS message is received on a Plivo number',
  props: {
    phone_number: plivoCommon.phone_number,
  },
  sampleData: {
    api_id: '5df1d1b8-3f9a-11ee-9c2b-0242ac110002',
    message_uuid: '2ee85898-d4aa-4cbe-a891-fdb67ecdf6cf',
    from_number: '14155551234',
    to_number: '14155555678',
    message_direction: 'inbound',
    message_state: 'received',
    message_time: '2026-07-27 10:15:00+00:00',
    text: 'Hello',
    message_type: 'sms',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callPlivoApi<MessagePaginationResponse>(
      HttpMethod.GET,
      'Message/?limit=20',
      { auth_id, auth_token }
    );
    await context.store.put<LastMessage>(STORE_KEY, {
      lastMessageId:
        response.body.objects.length === 0
          ? null
          : response.body.objects[0].message_uuid,
    });
  },
  async onDisable(context) {
    await context.store.put(STORE_KEY, null);
  },
  async run(context) {
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const to = context.propsValue.phone_number;
    const lastMessage = await context.store.get<LastMessage>(STORE_KEY);
    const response = await callPlivoApi<MessagePaginationResponse>(
      HttpMethod.GET,
      'Message/?limit=20',
      { auth_id, auth_token }
    );
    const objects = response.body.objects;
    const newMessages: unknown[] = [];
    for (const message of objects) {
      if (message.message_uuid === lastMessage?.lastMessageId) {
        break;
      }
      if (message.message_direction === 'inbound' && message.to_number === to) {
        newMessages.push(message);
      }
    }
    await context.store.put<LastMessage>(STORE_KEY, {
      lastMessageId: objects.length > 0 ? objects[0].message_uuid : lastMessage?.lastMessageId ?? null,
    });
    return newMessages;
  },
});
