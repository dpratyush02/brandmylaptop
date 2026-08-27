import DodoPayments from 'dodopayments';
import { Webhook } from 'standardwebhooks';

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY || '';
const DODO_ENV = (process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode') as
  | 'live_mode'
  | 'test_mode';
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || '';
const BID_PRODUCT_NAME = 'BrandMyLaptop Spot Bid';

let dodoClientInstance: DodoPayments | null = null;
let cachedProductId: string | null = process.env.DODO_PRODUCT_ID || null;

export function getDodoClient(): DodoPayments | null {
  if (!DODO_API_KEY || DODO_API_KEY.startsWith('test_dodo_api_key_sandbox') || DODO_API_KEY.trim() === '') {
    return null;
  }
  if (!dodoClientInstance) {
    try {
      dodoClientInstance = new DodoPayments({
        bearerToken: DODO_API_KEY,
        environment: DODO_ENV,
      });
    } catch (e) {
      console.warn('[DodoPayments] Initializing client failed:', e);
      return null;
    }
  }
  return dodoClientInstance;
}

export interface CreateCheckoutParams {
  spotId: string;
  spotNumber: number;
  bidId: string;
  bidAmount: number;
  chargeAmount: number;
  currency: 'USD';
  bidderName: string;
  bidderEmail: string;
  brandName: string;
  website?: string;
  logoUrl?: string;
  returnUrl?: string;
}

export interface CheckoutResult {
  sessionId: string;
  checkoutUrl: string;
  isSimulator: boolean;
}

async function getOrCreateBidProduct(client: DodoPayments): Promise<string> {
  if (cachedProductId) return cachedProductId;

  try {
    const page = await client.products.list({ page_size: 50 });
    for (const product of page.getPaginatedItems()) {
      if (product.name === BID_PRODUCT_NAME || product.metadata?.bml === 'spot_bid') {
        cachedProductId = product.product_id;
        return product.product_id;
      }
    }
  } catch (err) {
    console.warn('[DodoPayments] Product list check:', err);
  }

  const created = await client.products.create({
    name: BID_PRODUCT_NAME,
    description: 'Auction bid for a physical sticker spot on the HP laptop lid',
    tax_category: 'saas',
    price: {
      type: 'one_time_price',
      currency: 'USD',
      price: 1000,
      discount: 0,
      purchasing_power_parity: false,
      pay_what_you_want: true,
    },
    metadata: { bml: 'spot_bid' },
  });

  cachedProductId = created.product_id;
  return created.product_id;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const {
    spotId,
    spotNumber,
    bidId,
    bidAmount,
    chargeAmount,
    currency,
    bidderName,
    bidderEmail,
    brandName,
    website = '',
    returnUrl = process.env.DODO_RETURN_URL || 'http://localhost:3005/auction/success',
  } = params;

  const mockSessionId = `dodo_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const simulatorUrl = `/auction/checkout-simulator?sessionId=${mockSessionId}&bidId=${bidId}&spotNumber=${spotNumber}&amount=${chargeAmount}&currency=${currency}&brand=${encodeURIComponent(brandName)}&email=${encodeURIComponent(bidderEmail)}`;

  const client = getDodoClient();

  if (!client) {
    return { sessionId: mockSessionId, checkoutUrl: simulatorUrl, isSimulator: true };
  }

  try {
    const productId = await getOrCreateBidProduct(client);
    const amountCents = Math.round(chargeAmount * 100);

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          amount: amountCents,
        },
      ],
      billing_currency: 'USD',
      customer: {
        name: bidderName,
        email: bidderEmail,
      },
      return_url: `${returnUrl}?bidId=${bidId}&spotId=${spotId}&spotNumber=${spotNumber}&amount=${chargeAmount}&brand=${encodeURIComponent(brandName)}`,
      metadata: {
        auction_id: 'brandmylaptop_auction_1',
        spot_id: spotId,
        spot_number: spotNumber.toString(),
        bid_id: bidId,
        bid_amount: bidAmount.toString(),
        charge_amount: chargeAmount.toString(),
        currency,
        brand_name: brandName,
        bidder_email: bidderEmail,
        website: website.substring(0, 490),
      },
    });

    return {
      sessionId: session.session_id,
      checkoutUrl: session.checkout_url,
      isSimulator: false,
    };
  } catch (dodoErr: any) {
    console.warn('[DodoPayments API Notice]: Dodo returned an error (likely invalid/expired API key or test mode sandbox). Gracefully falling back to simulator checkout:', dodoErr?.message || dodoErr);
    return {
      sessionId: mockSessionId,
      checkoutUrl: simulatorUrl,
      isSimulator: true,
    };
  }
}

export async function verifyWebhookSignature(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>
): Promise<boolean> {
  if (!DODO_WEBHOOK_SECRET || DODO_WEBHOOK_SECRET === 'whsec_test_secret_for_local_dev') {
    return true;
  }

  try {
    const webhook = new Webhook(DODO_WEBHOOK_SECRET);
    const webhookHeaders = {
      'webhook-id': (headers['webhook-id'] as string) || '',
      'webhook-signature': (headers['webhook-signature'] as string) || '',
      'webhook-timestamp': (headers['webhook-timestamp'] as string) || '',
    };

    await webhook.verify(rawBody, webhookHeaders);
    return true;
  } catch (err) {
    console.error('[Dodo Webhook Signature Verification Failed]:', err);
    return false;
  }
}
