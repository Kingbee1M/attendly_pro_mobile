import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { leaveService } from './leave.services';
import { 
  CreateLeaveRequestBody, 
  LeaveRequestParams, 
  GetAllLeaveRequestsQuery, 
  RejectLeaveRequestBody 
} from '../../types';
import { LeaveStatus } from "@/enums/leaveStatus.enum";

// --- State Interface ---
interface LeaveState {
  allLeaveRequests: any[];
  myLeaveRequests: any[];
  selectedLeaveRequest: any | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  allLeaveRequests: [],
  myLeaveRequests: [],
  selectedLeaveRequest: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// --- Async Thunks ---

export const fetchAllLeaveRequests = createAsyncThunk(
  'leave/fetchAll',
  async (queryParameters: GetAllLeaveRequestsQuery | undefined, { rejectWithValue }) => {
    try {
      const resp = await leaveService.getAllLeaveRequests(queryParameters);
      return resp.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all leave requests');
    }
  }
);

export const fetchMyLeaveRequests = createAsyncThunk(
  'leave/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      
      const resp = await leaveService.getMyLeaveRequests();
      return resp.data.data
      
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Sorry but it seems we are unable to get your leave requests, please check your network or try again later');
    }
  }
);

export const fetchLeaveRequestById = createAsyncThunk(
  'leave/fetchById',
  async (leaveId: string, { rejectWithValue }) => {
    try {
      const resp = await leaveService.getLeaveRequestById(leaveId);
      return resp.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave request details');
    }
  }
);

export const createLeaveRequest = createAsyncThunk(
  'leave/create',
  async (body: CreateLeaveRequestBody, { rejectWithValue }) => {
    try {
       const resp = await leaveService.createLeaveRequest(body);
      return resp.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave request');
    }
  }
);

export const setLeaveStatus = createAsyncThunk(
  'leave/setStatus',
  async (
    payload: {
      action: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
      params: LeaveRequestParams;
      rejectionData?: RejectLeaveRequestBody;
    },
    { rejectWithValue }
  ) => {
    try {
      return await leaveService.setLeaveRequest(payload.action, payload.params, payload.rejectionData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave request status');
    }
  }
);

// --- Leave Slice ---

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearLeaveError: (state) => {
      state.error = null;
    },
    clearSelectedLeave: (state) => {
      state.selectedLeaveRequest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All Leave Requests ---
      .addCase(fetchAllLeaveRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllLeaveRequests.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.allLeaveRequests = action.payload?.data || action.payload;
      })
      .addCase(fetchAllLeaveRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // --- Fetch My Leave Requests ---
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.myLeaveRequests = action.payload?.data || action.payload;
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // --- Fetch Single Leave Request ---
      .addCase(fetchLeaveRequestById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaveRequestById.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.selectedLeaveRequest = action.payload?.data || action.payload;
      })
      .addCase(fetchLeaveRequestById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // --- Create Leave Request ---
      .addCase(createLeaveRequest.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createLeaveRequest.fulfilled, (state, action: PayloadAction<any>) => {
        state.isSubmitting = false;
        const newLeave = action.payload?.data || action.payload;
        state.myLeaveRequests.unshift(newLeave);
      })
      .addCase(createLeaveRequest.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      // --- Approve / Reject Leave Request ---
      .addCase(setLeaveStatus.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(setLeaveStatus.fulfilled, (state, action: PayloadAction<any>) => {
        state.isSubmitting = false;
        const updatedLeave = action.payload?.data || action.payload;

        // Update list locally
        if (updatedLeave?.id) {
          state.allLeaveRequests = state.allLeaveRequests.map((item) =>
            item.id === updatedLeave.id ? updatedLeave : item
          );
        }
      })
      .addCase(setLeaveStatus.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLeaveError, clearSelectedLeave } = leaveSlice.actions;
export default leaveSlice.reducer;