import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

/**
 * Cliente Redis tolerante a fallos: si Redis no responde, la caché se omite y los
 * locks "fail-open" (el sistema sigue funcionando; solo se pierde la coordinación).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly log = new Logger('Redis');
  private readonly client: Redis;
  private errored = false;

  constructor(cfg: ConfigService) {
    this.client = new Redis(cfg.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (n) => Math.min(n * 500, 5000),
    });
    this.client.on('error', (e) => {
      if (!this.errored) this.log.warn(`Redis no disponible: ${e.message}`);
      this.errored = true;
    });
    this.client.on('ready', () => {
      if (this.errored) this.log.log('Redis reconectado');
      this.errored = false;
    });
  }

  async ping(): Promise<boolean> {
    try { return (await this.client.ping()) === 'PONG'; } catch { return false; }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const v = await this.client.get(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch { return null; }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try { await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch { /* caché opcional */ }
  }

  async del(...keys: string[]): Promise<void> {
    try { if (keys.length) await this.client.del(...keys); } catch { /* ignore */ }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length) await this.client.del(...keys);
    } catch { /* ignore */ }
  }

  /** Ejecuta fn solo si se obtiene el lock (SET NX EX). Fail-open si Redis cae. */
  async withLock<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T | undefined> {
    const token = randomUUID();
    let acquired = true;
    try {
      acquired = (await this.client.set(`lock:${key}`, token, 'EX', ttlSeconds, 'NX')) === 'OK';
    } catch { acquired = true; }
    if (!acquired) return undefined;
    try {
      return await fn();
    } finally {
      try {
        if ((await this.client.get(`lock:${key}`)) === token) await this.client.del(`lock:${key}`);
      } catch { /* ignore */ }
    }
  }

  async onModuleDestroy() {
    try { await this.client.quit(); } catch { this.client.disconnect(); }
  }
}
