import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee';
import { employeeApi } from '../services/api';

export interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: EmployeeState = {
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,
  searchQuery: '',
};

// Async thunks
export const fetchEmployees = createAsyncThunk(
  'employee/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeApi.getAll();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employees');
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'employee/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await employeeApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employee');
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employee/create',
  async (employee: CreateEmployeeRequest, { rejectWithValue }) => {
    try {
      await employeeApi.create(employee);
      return await employeeApi.getAll();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employee/update',
  async ({ id, employee }: { id: string; employee: UpdateEmployeeRequest }, { rejectWithValue }) => {
    try {
      await employeeApi.update(id, employee);
      return await employeeApi.getAll();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update employee');
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employee/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await employeeApi.delete(id);
      return await employeeApi.getAll();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete employee');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    },
    setSelectedEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.selectedEmployee = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action: PayloadAction<Employee[]>) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action: PayloadAction<Employee>) => {
        state.loading = false;
        state.selectedEmployee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action: PayloadAction<Employee[]>) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action: PayloadAction<Employee[]>) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action: PayloadAction<Employee[]>) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedEmployee, setSelectedEmployee, setSearchQuery } = employeeSlice.actions;
export default employeeSlice.reducer;