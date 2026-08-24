import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/slices/authSlice';  
import attendanceSlice from '@/features/Attendance/attendanceSlice';
import leaveReducer from '@/features/leave/leaveSlice';
import clockInSlice from '@/features/clockInandOut/clockInSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,  
    attendance: attendanceSlice, 
    clock: clockInSlice,
    leave: leaveReducer
  },
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
