/**
 * Flutterwave OP Stack Integration Helper
 * Markazu Umar bn Al-Khattab School Management System
 */

export interface FlutterwaveVerifyResponse {
  status: string; // "success" or "error"
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint?: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee?: number;
    merchant_fee?: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string; // "successful", "failed"
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
  };
}

/**
 * Verify a transaction directly with Flutterwave API v3
 */
export async function verifyFlutterwaveTransaction(transactionId: string | number): Promise<FlutterwaveVerifyResponse> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('FLUTTERWAVE_SECRET_KEY is not configured in server environment');
  }

  const endpoint = `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    cache: 'no-store',
  });

  const body = await response.json();
  return body as FlutterwaveVerifyResponse;
}
