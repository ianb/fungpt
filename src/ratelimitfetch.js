export class RateLimitFetch {
  constructor(concurrentLimit) {
    this.concurrentLimit = concurrentLimit;
    this.concurrentCount = 0;
    this.backoff = 0;
    this.lastRun = null;
    this.queue = [];
  }

  async fetch(url, options) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.concurrentCount >= this.concurrentLimit) {
      return;
    }
    const next = this.queue.shift();
    if (!next) {
      return;
    }
    this.concurrentCount++;
    if (this.lastRun && this.backoff && Date.now() - this.lastRun < this.backoff) {
      this.queue.unshift(next);
      this.concurrentCount--;
      setTimeout(() => {
        this.processQueue();
      }, this.backoff);
      return;
    }
    this.lastRun = Date.now();
    if (this.backoff === 1000) {
      this.backoff = 0;
    } else if (this.backoff) {
      this.backoff = 1000;
    }
    try {
      const resp = await fetch(next.url, next.options);
      if (resp.status == 429) {
        this.queue.push(next);
        this.backoff = Math.max(Math.min(this.backoff * 2, 10000), 1000);
        this.processQueue();
        return;
      }
      next.resolve(resp);
    } catch (e) {
      next.reject(e);
    } finally {
      this.concurrentCount--;
      this.processQueue();
    }
  }
}
