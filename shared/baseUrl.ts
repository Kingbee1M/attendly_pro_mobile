// export const baseUrl = "https://uat-software.outcess.com:7000"; 

// export const baseUrl = "https://disengage-shorten-voter.ngrok-free.dev"
export const baseUrl = "https://uat-software.outcess.com:7000/api/v1"

type QueryParams = {
  path?: string; 
  page?: number;
  limit?: number;
  filterByDate?: 'range' | 'today';
  startDate?: string;
  endDate?: string;
};

export const buildDynamicURL = (
  base: string,
  query?: QueryParams
): string => {
  let url = base;

  if (query?.path) {
    url += `/${query.path}`;
  }

  const queryParams: string[] = [];
 
  if (query?.page) queryParams.push(`page=${query.page}`);
  if (query?.limit) queryParams.push(`limit=${query.limit}`);
  if (query?.filterByDate) queryParams.push(`filterByDate=${query.filterByDate}`);
  if (query?.startDate) queryParams.push(`startDate=${query.startDate}`);
  if (query?.endDate) queryParams.push(`endDate=${query.endDate}`);

  if (queryParams.length > 0) {
    url += '?' + queryParams.join('&');
  }
 

  return url;
};


  
 