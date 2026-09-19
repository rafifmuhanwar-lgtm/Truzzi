/**
 * BuatQris Payment Gateway — integrasi REST API + webhook HMAC-SHA256.
 * Dokumentasi: https://api.buatqris.site
 *
 * Semua secret (account_id, secret_token) hanya di server, tidak pernah ke browser.
 */
import axios from 'axios';
import crypto from 'node:crypto';
import { config } from '../config.js';

export interface CreateQrisOptions {
  amount: number;
  description?: string;
  qrisMethod?: string; // qris_one | qris_two | qris_three | qris_four
  callbackUrl?: string;
  umkmName?: string;
  test?: boolean; // mode sandbox
}

export interface QrisResult {
  success: boolean;
  message?: string;
  data?: {
    transaction_id: string;
    qr_url?: string;
    qris_image?: string;
    payment_url?: string;
    amount?: number;
    total_amount?: number;
    status?: string;
    expired_at?: string;
  };
}

export interface CheckStatusResult {
  success: boolean;
  message?: string;
  data?: {
    transaction_id?: string;
    status?: 'pending' | 'success' | 'expired' | 'failed';
    amount?: number;
    total_amount?: number;
    credit_amount?: number;
    admin_fee?: number;
    qris_method?: string;
    is_test?: boolean;
    paid_at?: string;
  };
}

/** POST form-urlencoded ke API BuatQris. */
async function postForm(
  params: Record<string, string | number | boolean | undefined>,
): Promise<any> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') body.append(k, String(v));
  }
  const r = await axios.post(config.buatqris.baseUrl, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  return r.data;
}

/** Buat transaksi QRIS baru. */
export async function createQris(opts: CreateQrisOptions): Promise<QrisResult> {
  return postForm({
    action: 'api_create_qris',
    account_id: config.buatqris.accountId,
    secret_token: config.buatqris.secretToken,
    amount: Math.round(opts.amount),
    description: opts.description,
    qris_method: opts.qrisMethod,
    callback_url: opts.callbackUrl,
    umkm_name: opts.umkmName,
    ...(opts.test ? { test: 1 } : {}),
  }) as Promise<QrisResult>;
}

/** Cek status transaksi. */
export async function checkStatus(transactionId: string): Promise<CheckStatusResult> {
  return postForm({
    action: 'api_check_status',
    account_id: config.buatqris.accountId,
    secret_token: config.buatqris.secretToken,
    transaction_id: transactionId,
  }) as Promise<CheckStatusResult>;
}

/** Tandai transaksi test lunas (mode sandbox). */
export async function testPay(transactionId: string): Promise<any> {
  return postForm({
    action: 'test_pay',
    account_id: config.buatqris.accountId,
    secret_token: config.buatqris.secretToken,
    id: transactionId,
  });
}

/**
 * Verifikasi signature webhook BuatQris.
 * Header: X-BuatQris-Signature: sha256=<hex>, dihitung dari raw body + signing secret.
 */
export function verifySignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', config.buatqris.signingSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
