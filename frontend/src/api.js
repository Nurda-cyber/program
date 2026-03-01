const API_BASE = '/api';

export const api = {
  async request(method, path, data = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') && {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }),
      },
    };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      opts.body = JSON.stringify(data);
    }
    const res = await fetch(`${API_BASE}${path}`, opts);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || res.statusText);
    return body;
  },
  get(path) {
    return this.request('GET', path).then((data) => ({ data }));
  },
  post(path, data) {
    return this.request('POST', path, data);
  },
};
