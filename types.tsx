/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';



declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}



export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  AppStack: NavigatorScreenParams<RootTabParamList> | undefined;
  AuthStack: NavigatorScreenParams<RootTabParamList> | undefined;
  Checkout: undefined;
  Home: undefined;
  ClockIn: undefined;
  navigation: undefined;
  Notifications: undefined;
  Profile: undefined;
  Splash: undefined;
  Login: undefined;
  ChangePassword: undefined;
  Success: undefined;
  NotificationsSettings: undefined;
  SuccessProfile: undefined;
  ForgotPassword: undefined;
  AttachmentModal: undefined;
  ForgotPasswordSuccess: undefined;
  BarCodeCamera: undefined;
  Successs: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

export type RootTabParamList = {

  Home: undefined;
  Attendance: undefined;
  Profile: undefined;
  Leave: undefined
};


import { LeaveType } from './enums/leaveType.enum';
import { LeaveStatus } from './enums/leaveStatus.enum';
export interface CreateLeaveRequestBody {
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason?: string;
}

export interface LeaveRequestParams {
  leaveId: string;
}

export interface GetAllLeaveRequestsQuery {
  page?: number; 
  limit?: number;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  officeId?: string;
  search?: string;
}

export interface RejectLeaveRequestBody {
  rejectionReason: string;
}

export interface Approver {
  id: string;
  name: string;
  email: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  approvedById: string | null;
  startDate: string;
  endDate: string;
  leaveType: LeaveType | string;
  reason: string;
  status: LeaveStatus;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  approvedBy?: Approver | null;
}

// --- API Response Contracts ---

export interface MyLeaveRequestsData {
  message: string;
  data: LeaveRequest[];
}

export interface FetchMyLeaveRequestsResponse {
  message: string;
  data: MyLeaveRequestsData;
}