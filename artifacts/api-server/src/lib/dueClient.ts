import { logger } from "./logger";

const DUE_BASE_URL = process.env.DUE_BASE_URL ?? "https://sandbox.due.com";
const DUE_API_KEY = process.env.DUE_API_KEY ?? "";

export interface DueSource {
  amount: number;
  currency: string;
  rail: string;
}

export interface DueDestination {
  currency: string;
  rail: string;
}

export interface DueQuoteParams {
  source: DueSource;
  destination: DueDestination;
}

export interface DueTransferParams {
  quote: string;
  recipient: string;
  memo?: string;
  metadata?: Record<string, string>;
}

export interface DuePayoutParams {
  source: DueSource;
  destination: DueDestination;
  recipientId: string;
  memo?: string;
  metadata?: Record<string, string>;
}

export interface DueQuoteData {
  token: string;
  expires_at?: string;
  source?: DueSource;
  destination?: DueDestination;
  [key: string]: unknown;
}

export interface DueTransferData {
  id: string;
  status: string;
  created_at?: string;
  [key: string]: unknown;
}

type DueOk<T> = { ok: true; data: T };
type DueFail = { ok: false; error: string; status?: number };
export type DueResult<T> = DueOk<T> | DueFail;

export type DuePayoutResult =
  | { ok: true; quote: DueQuoteData; transfer: DueTransferData }
  | { ok: false; step: "quote" | "transfer"; error: string };

class DueClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = `${DUE_BASE_URL}/v1`;
    this.apiKey = DUE_API_KEY;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<DueResult<T>> {
    const url = `${this.baseUrl}${path}`;
    logger.info(`→ Due ${method} ${path}`);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15_000),
      });

      let data: unknown;
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const errorMsg =
          typeof data === "object" && data !== null && "message" in data
            ? String((data as Record<string, unknown>).message)
            : `Due API error ${res.status}`;
        logger.error({ status: res.status, data }, `Due error: ${path}`);
        return { ok: false, error: errorMsg, status: res.status };
      }

      logger.info({ status: res.status }, `← Due ${res.status} ${path}`);
      return { ok: true, data: data as T };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      logger.error({ err }, `Due request failed: ${path}`);
      return { ok: false, error: msg };
    }
  }

  async getAccountInfo(): Promise<DueResult<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>("GET", "/kyc");
  }

  async createQuote(params: DueQuoteParams): Promise<DueResult<DueQuoteData>> {
    return this.request<DueQuoteData>("POST", "/transfers/quote", params);
  }

  async createTransfer(
    params: DueTransferParams,
  ): Promise<DueResult<DueTransferData>> {
    const { quote, recipient, memo, metadata = {} } = params;
    const payload: Record<string, unknown> = { quote, recipient };
    if (memo) payload.memo = memo;
    if (Object.keys(metadata).length) payload.metadata = metadata;
    return this.request<DueTransferData>("POST", "/transfers", payload);
  }

  async getTransfer(transferId: string): Promise<DueResult<DueTransferData>> {
    return this.request<DueTransferData>(
      "GET",
      `/transfers/${encodeURIComponent(transferId)}`,
    );
  }

  async listTransfers(limit = 20): Promise<DueResult<unknown>> {
    return this.request<unknown>("GET", `/transfers?limit=${limit}`);
  }

  async listRecipients(limit = 50): Promise<DueResult<unknown>> {
    return this.request<unknown>("GET", `/recipients?limit=${limit}`);
  }

  async sendPayout(params: DuePayoutParams): Promise<DuePayoutResult> {
    const { source, destination, recipientId, memo, metadata } = params;
    logger.info(
      `Due payout: ${source.amount} ${source.currency}/${source.rail} → ${destination.currency}/${destination.rail}`,
    );

    const quoteResult = await this.createQuote({ source, destination });
    if (!quoteResult.ok) {
      logger.error({ quoteResult }, "Due quote failed");
      return { ok: false, step: "quote", error: quoteResult.error };
    }

    const { token } = quoteResult.data;
    const transferResult = await this.createTransfer({
      quote: token,
      recipient: recipientId,
      memo,
      metadata,
    });

    if (!transferResult.ok) {
      logger.error({ transferResult }, "Due transfer failed");
      return { ok: false, step: "transfer", error: transferResult.error };
    }

    return {
      ok: true,
      quote: quoteResult.data,
      transfer: transferResult.data,
    };
  }
}

export const dueClient = new DueClient();
