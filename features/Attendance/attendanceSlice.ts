import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import attendanceService, { AttendanceInput } from './attendanceService';

// Define the CalendarQueryParams type
export type CalendarQueryParams = { 
  id?: string;
  page?: number;
  limit?: number;
  filterByDate?: 'today' | 'range';
  startDate?: string;
  endDate?: string;
};

// Define the CalendarData type
export type CalendarData = {
  id: number;
  date: string;
  events: string[];
};

 

// Define the initial state
const initialState: {
  data: any;
  isError: boolean;
  isSuccess: boolean;
  isLoading: boolean;
  message: string;

  calenderdata: CalendarData[] | null;
  calenderisError: boolean;
  calenderisSuccess: boolean;
  calenderisLoading: boolean;
  calendermessage: string;

  handleAttendancedata: any;
  handleAttendanceisError: boolean;
  handleAttendanceisSuccess: boolean;
  handleAttendanceisLoading: boolean;
  handleAttendancemessage: string;
} = {
  data: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',

  calenderdata: null,
  calenderisError: false,
  calenderisSuccess: false,
  calenderisLoading: false,
  calendermessage: '',

  handleAttendancedata: null,
  handleAttendanceisError: false,
  handleAttendanceisSuccess: false,
  handleAttendanceisLoading: false,
  handleAttendancemessage: '',
};

// Thunk to get logged-in user attendance
export const getLoggedInUserAttendance = createAsyncThunk('attendance/getLoggedInUserAttendance', async (id: string, thunkAPI) => {
  try {
    return await attendanceService.getLoggedInUserAttendance(id);
  } catch (error: any) {
    const message =
      (error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        error.message ||
        error.toString()) as string;
    return thunkAPI.rejectWithValue(message);
  }
});

// Thunk to get calendar data
export const getCalender = createAsyncThunk(
  'attendance/getCalender',
  async (params: CalendarQueryParams, thunkAPI) => {
    try {
      return await attendanceService.getCalender(params);
    } catch (error: any) {
      const message =
        (error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.message ||
          error.message ||
          error.toString()) as string;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk to submit attendance check-in/out
export const handleAttendance = createAsyncThunk(
  'attendance/handleAttendance',
  async (data: AttendanceInput, thunkAPI) => {
    try {
      return await attendanceService.handleAttendance(data);
    } catch (error: any) {
      const message =
        (error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.message ||
          error.message ||
          error.toString()) as string;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

 

// Attendance slice
export const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';

      state.calenderisLoading = false;
      state.calenderisSuccess = false;
      state.calenderisError = false;
      state.calendermessage = '';

      state.handleAttendanceisLoading = false;
      state.handleAttendanceisSuccess = false;
      state.handleAttendanceisError = false;
      state.handleAttendancemessage = '';

     
    },
  },
  extraReducers: (builder) => {
    builder
      // Attendance
      .addCase(getLoggedInUserAttendance.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLoggedInUserAttendance.fulfilled, (state, action) => {
        
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
      })
      .addCase(getLoggedInUserAttendance.rejected, (state:any, action ) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.data = null;
      })

      // Calendar
      .addCase(getCalender.pending, (state) => {
        state.calenderisLoading = true;
      })
      .addCase(getCalender.fulfilled, (state: any, action) => { 
        state.calenderisLoading = false;
        state.calenderisSuccess = true;
        state.calenderdata = action.payload;
      })
      .addCase(getCalender.rejected, (state, action) => {
        state.calenderisLoading = false;
        state.calenderisError = true;
        state.calendermessage = (action.payload as string) || '';
        state.calenderdata = null;
      })

      // Attendance
      .addCase(handleAttendance.pending, (state) => {
        state.handleAttendanceisLoading = true;
      })
      .addCase(handleAttendance.fulfilled, (state: any, action) => { 
        state.handleAttendanceisLoading = false;
        state.handleAttendanceisSuccess = true;
        state.handleAttendancedata = action.payload;
      })
      .addCase(handleAttendance.rejected, (state, action) => {
        state.handleAttendanceisLoading = false;
        state.handleAttendanceisError = true;
        state.handleAttendancemessage = (action.payload as string) || '';
        state.handleAttendancedata = null;
      })

    
      
  },
});

export const { reset } = attendanceSlice.actions;
export default attendanceSlice.reducer;

 

 
 