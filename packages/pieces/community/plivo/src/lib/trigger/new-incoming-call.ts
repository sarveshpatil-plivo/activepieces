import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi, plivoCommon } from '../common';
import { plivoAuth } from '../..';

interface LastCall {
  lastCallId: string | null;
}

interface CallPaginationResponse {
  objects: {
    call_uuid: string;
    from_number: string;
    to_number: string;
    call_direction: string;
  }[];
}

const STORE_KEY = '_new_incoming_call_trigger';

export const plivoNewIncomingCall = createTrigger({
  auth: plivoAuth,
  name: 'new_incoming_call',
  displayName: 'New Incoming Call',
  description: 'Triggers when a new inbound call is received on a Plivo number',
  props: {
    phone_number: plivoCommon.phone_number,
  },
  sampleData: {
    api_id: '8a1c9f2e-3f9a-11ee-9c2b-0242ac110002',
    call_uuid: '72a5f3d8-1e4b-4c9a-9f2e-abc123def456',
    from_number: '14155551234',
    to_number: '14155555678',
    call_direction: 'inbound',
    call_state: 'ANSWER',
    call_duration: 42,
    end_time: '2026-07-27 10:20:00+00:00',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callPlivoApi<CallPaginationResponse>(
      HttpMethod.GET,
      'Call/?limit=20',
      { auth_id, auth_token }
    );
    await context.store.put<LastCall>(STORE_KEY, {
      lastCallId:
        response.body.objects.length === 0
          ? null
          : response.body.objects[0].call_uuid,
    });
  },
  async onDisable(context) {
    await context.store.put(STORE_KEY, null);
  },
  async run(context) {
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const to = context.propsValue.phone_number;
    const lastCall = await context.store.get<LastCall>(STORE_KEY);
    const response = await callPlivoApi<CallPaginationResponse>(
      HttpMethod.GET,
      'Call/?limit=20',
      { auth_id, auth_token }
    );
    const objects = response.body.objects;
    const newCalls: unknown[] = [];
    for (const call of objects) {
      if (call.call_uuid === lastCall?.lastCallId) {
        break;
      }
      if (call.call_direction === 'inbound' && call.to_number === to) {
        newCalls.push(call);
      }
    }
    await context.store.put<LastCall>(STORE_KEY, {
      lastCallId: objects.length > 0 ? objects[0].call_uuid : lastCall?.lastCallId ?? null,
    });
    return newCalls;
  },
});
