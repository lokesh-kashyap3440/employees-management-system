import employeeReducer, {
  fetchEmployees,
  createEmployee,
} from '../employeeSlice';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  employeeApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('employeeSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        employee: employeeReducer,
      },
    });
    vi.clearAllMocks();
  });

  const initialState = {
    employees: [],
    selectedEmployee: null,
    loading: false,
    error: null,
  };

  it('should handle initial state', () => {
    expect(employeeReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('fetchEmployees', () => {
    it('should set loading true when pending', () => {
      const action = { type: fetchEmployees.pending.type };
      const state = employeeReducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should update employees when fulfilled', async () => {
      const mockEmployees = [{ _id: '1', name: 'John' }];
      (api.employeeApi.getAll as any).mockResolvedValue(mockEmployees);

      await store.dispatch(fetchEmployees());

      const state = store.getState().employee;
      expect(state.loading).toBe(false);
      expect(state.employees).toEqual(mockEmployees);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to fetch';
      (api.employeeApi.getAll as any).mockRejectedValue({ response: { data: { error: errorMessage } } });

      await store.dispatch(fetchEmployees());

      const state = store.getState().employee;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  // Add more tests for other thunks (create, update, delete) as needed...
  describe('createEmployee', () => {
     it('should update employees list on success', async () => {
        const mockEmployees = [{ _id: '1', name: 'John' }];
        (api.employeeApi.create as any).mockResolvedValue({});
        (api.employeeApi.getAll as any).mockResolvedValue(mockEmployees);

        await store.dispatch(createEmployee({ name: 'John' }));

        const state = store.getState().employee;
        expect(state.loading).toBe(false);
        expect(state.employees).toEqual(mockEmployees);
     });
  });
});
