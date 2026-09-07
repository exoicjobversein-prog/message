import { Request, Response } from 'express';
import { SmsMessage, SmsStatus } from '../models/SmsMessage';

const STATUS_MAP: Record<string, SmsStatus> = {
  queued: 'queued',
  sent: 'sent',
  delivered: 'delivered',
  undelivered: 'undelivered',
  failed: 'failed',
};

export async function plivoStatus(req: Request, res: Response): Promise<void> {
  const body = { ...req.body, ...req.query } as Record<string, string>;
  const uuid = body.MessageUUID || body.messageUUID || body.message_uuid;
  const rawStatus = (body.Status || body.status || '').toLowerCase();
  const errorCode = body.ErrorCode || body.errorCode;

  if (uuid) {
    const message = await SmsMessage.findOne({
      where: { providerMessageUuid: uuid },
    });
    if (message) {
      const status = STATUS_MAP[rawStatus];
      if (status) message.status = status;
      if (status === 'delivered') message.deliveredAt = new Date();
      if ((status === 'failed' || status === 'undelivered') && errorCode) {
        message.error = `Plivo ErrorCode ${errorCode}`;
      }
      await message.save();
    }
  }

  res.status(200).type('text/plain').send('OK');
}
