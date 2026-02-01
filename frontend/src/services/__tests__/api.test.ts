import { vi, describe, it, expect, beforeEach } from 'vitest';
import { authApi, employeeApi, notificationApi } from '../api';
import axios from 'axios';

vi.mock('axios', () => {
  const mAxios = {
    create: vi.fn().mockReturnThis(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
  };
  return { default: mAxios };
});

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authApi.login should call axios.post', async () => {
    (axios.post as any).mockResolvedValue({ data: { accessToken: 't' } });
    const res = await authApi.login({ username: 'u', password: 'p' });
    expect(axios.post).toHaveBeenCalledWith('/auth/login', expect.anything());
    expect(res.accessToken).toBe('t');
  });

  it('authApi.googleLogin should call axios.post', async () => {
    (axios.post as any).mockResolvedValue({ data: { accessToken: 'g' } });
    const res = await authApi.googleLogin('id-token');
    expect(axios.post).toHaveBeenCalledWith('/auth/google', { idToken: 'id-token' });
    expect(res.accessToken).toBe('g');
  });

  it('employeeApi.getAll should call axios.get', async () => {
    (axios.get as any).mockResolvedValue({ data: [] });
    await employeeApi.getAll();
    expect(axios.get).toHaveBeenCalledWith('/employees');
  });

  it('employeeApi.getById should call axios.get with id', async () => {
    (axios.get as any).mockResolvedValue({ data: {} });
    await employeeApi.getById('123');
    expect(axios.get).toHaveBeenCalledWith('/employees/123');
  });

  it('employeeApi.create should call axios.post', async () => {
    (axios.post as any).mockResolvedValue({ data: { insertedId: '1' } });
    await employeeApi.create({ name: 'N' } as any);
    expect(axios.post).toHaveBeenCalledWith('/employees', { name: 'N' });
  });

  it('employeeApi.update should call axios.put', async () => {
    (axios.put as any).mockResolvedValue({ data: { modifiedCount: 1 } });
    await employeeApi.update('123', { name: 'U' } as any);
    expect(axios.put).toHaveBeenCalledWith('/employees/123', { name: 'U' });
  });

  it('employeeApi.delete should call axios.delete', async () => {
    (axios.delete as any).mockResolvedValue({ data: { deletedCount: 1 } });
    await employeeApi.delete('123');
    expect(axios.delete).toHaveBeenCalledWith('/employees/123');
  });

  it('notificationApi.getAll should call axios.get', async () => {
    (axios.get as any).mockResolvedValue({ data: [] });
    await notificationApi.getAll();
    expect(axios.get).toHaveBeenCalledWith('/notifications');
  });

  it('notificationApi.clearAll should call axios.delete', async () => {
    (axios.delete as any).mockResolvedValue({ data: {} });
    await notificationApi.clearAll();
    expect(axios.delete).toHaveBeenCalledWith('/notifications');
  });
});