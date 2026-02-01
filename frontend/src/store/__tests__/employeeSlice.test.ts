import { vi, describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import employeeReducer, {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setSelectedEmployee,
  clearSelectedEmployee
} from '../employeeSlice';
import { employeeApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  employeeApi: {
    getAll: vi.fn(),
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

  it('should handle setSelectedEmployee', () => {
    const emp = { name: 'John' } as any;
    store.dispatch(setSelectedEmployee(emp));
    expect(store.getState().employee.selectedEmployee).toEqual(emp);
  });

  it('should handle clearSelectedEmployee', () => {
    store.dispatch(clearSelectedEmployee());
    expect(store.getState().employee.selectedEmployee).toBeNull();
  });

  describe('async thunks', () => {
    it('fetchEmployees.fulfilled', async () => {
      const emps = [{ name: 'E1' }];
      (employeeApi.getAll as any).mockResolvedValue(emps);
      await store.dispatch(fetchEmployees());
      expect(store.getState().employee.employees).toEqual(emps);
    });

    it('createEmployee.fulfilled', async () => {
      (employeeApi.create as any).mockResolvedValue({ insertedId: '1' });
      (employeeApi.getAll as any).mockResolvedValue([{ name: 'New' }]);
      await store.dispatch(createEmployee({ name: 'New' }));
      expect(store.getState().employee.employees).toHaveLength(1);
    });

    it('updateEmployee.fulfilled', async () => {
      (employeeApi.update as any).mockResolvedValue({ modifiedCount: 1 });
      (employeeApi.getAll as any).mockResolvedValue([{ name: 'Updated' }]);
      await store.dispatch(updateEmployee({ id: '1', employee: { name: 'Updated' } }));
      expect(store.getState().employee.employees[0].name).toBe('Updated');
    });

    it('deleteEmployee.fulfilled', async () => {
      (employeeApi.delete as any).mockResolvedValue({ deletedCount: 1 });
      (employeeApi.getAll as any).mockResolvedValue([]);
      await store.dispatch(deleteEmployee('1'));
      expect(store.getState().employee.employees).toHaveLength(0);
    });

    it('fetchEmployees.rejected', async () => {
        (employeeApi.getAll as any).mockRejectedValue({ response: { data: { error: 'failed' } } });
        await store.dispatch(fetchEmployees());
        expect(store.getState().employee.error).toBe('failed');
    });

    it('createEmployee.rejected', async () => {
        (employeeApi.create as any).mockRejectedValue({ response: { data: { error: 'c fail' } } });
        await store.dispatch(createEmployee({ name: 'N' }));
        expect(store.getState().employee.error).toBe('c fail');
    });

    it('updateEmployee.rejected', async () => {
        (employeeApi.update as any).mockRejectedValue({ response: { data: { error: 'u fail' } } });
        await store.dispatch(updateEmployee({ id: '1', employee: { name: 'U' } }));
        expect(store.getState().employee.error).toBe('u fail');
    });

    it('deleteEmployee.rejected', async () => {
        (employeeApi.delete as any).mockRejectedValue({ response: { data: { error: 'd fail' } } });
        await store.dispatch(deleteEmployee('1'));
        expect(store.getState().employee.error).toBe('d fail');
    });

    it('should set loading true on fetchEmployees.pending', () => {
        const state = employeeReducer(undefined, { type: fetchEmployees.pending.type });
        expect(state.loading).toBe(true);
    });

    it('should set loading true on createEmployee.pending', () => {
        const state = employeeReducer(undefined, { type: createEmployee.pending.type });
        expect(state.loading).toBe(true);
    });
  });
});