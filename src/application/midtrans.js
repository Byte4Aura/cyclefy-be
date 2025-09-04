import midtransClient from 'midtrans-client';
import { env } from './env.js';

export const snap = new midtransClient.Snap({
    isProduction: env.midtrans.isProduction === 'true',
    serverKey: env.midtrans.serverKey,
    clientKey: env.midtrans.clientKey,
});
