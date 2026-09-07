import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { 
  CreateLeaveRequestBody, 
  LeaveRequestParams,
  GetAllLeaveRequestsQuery,
  RejectLeaveRequestBody 
} from '../../types';
import { LeaveStatus } from "@/enums/leaveStatus.enum";
const baseUrl = "https://uat-software.outcess.com:7000/api/v1"
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const userInfoStr = await AsyncStorage.getItem('attendly-user-info');

      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        const token = userInfo?.data?.token;
          config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ attendly-user-info not found in AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error reading attendly-user-info from AsyncStorage:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const PATH = 'leave';

export const leaveService = {
  getAllLeaveRequests: async (queryParameters?: GetAllLeaveRequestsQuery) => {
    const response = await api.get(PATH, {
      params: queryParameters,
    });

    return response.data;
  },

  getMyLeaveRequests: async () => {
    const response = await api.get(`${PATH}/my`);
    return response.data;
  },

  getLeaveRequestById: async (leaveId: string) => {
    const response = await api.get(`${PATH}/${leaveId}`);
    return response.data;
  },

  createLeaveRequest: async (body: CreateLeaveRequestBody) => {
    const response = await api.post(PATH, body);
    return response.data;
  },

  setLeaveRequest: async (
    action: LeaveStatus.APPROVED | LeaveStatus.REJECTED, 
    params: LeaveRequestParams, 
    rejectionData?: RejectLeaveRequestBody
  ) => {
    const suffix = action === LeaveStatus.APPROVED ? 'approve' : 'reject';
    const endpoint = `${PATH}/${params.leaveId}/${suffix}`;
    
    if (action === LeaveStatus.APPROVED) {
      const response = await api.put(endpoint);
      return response.data;
    } else {
      const response = await api.put(endpoint, rejectionData);
      return response.data;
    }
  },
};