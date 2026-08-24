import { getConfig } from '@/hooks/config';
import { baseUrl, buildDynamicURL } from '@/shared/baseUrl';
import axios from 'axios';
 
 

// typescript
interface CalendarQueryParams {
   id?: string ; 
  page?: number;
  limit?: number;
  filterByDate?: 'today' | 'range';
  startDate?: string;
  endDate?: string;
}

export interface AttendanceInput {
  token: string;
  userId: string;
  userLat?: number;
  userLng?: number;
  deviceId: string;
}

// Attendance
const handleAttendance = async (input: AttendanceInput) => {
  const config = await getConfig(); 
  const { data } = await axios.post(`${baseUrl}/api/v1/attendance/`, input, config); 
  return data;
};
const getLoggedInUserAttendance = async (id: string) => {
  
  const config = await getConfig(); 
  const { data } = await axios.get(`${baseUrl}/api/v1/attendance/${id}`, config); 
  return data;
};

 
const getCalender = async (params: CalendarQueryParams) => { 
  const config = await getConfig();
    const url = buildDynamicURL(`${baseUrl}/api/v1/attendance/${params.id}`, { 
      page: params.page,
      limit: params.limit,
      filterByDate: params.filterByDate,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    const { data } = await axios.get(url, config);
  return data;
};


 
// Service
const attendanceService = {
  getLoggedInUserAttendance, 
  getCalender,
  handleAttendance
};

export default attendanceService;
