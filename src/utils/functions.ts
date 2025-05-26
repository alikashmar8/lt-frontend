import { HttpHeaders } from '@angular/common/http';

export function getAdminAccessToken() {
  return localStorage.getItem('admin_access_token');
}

export function getAdminHeaders(): HttpHeaders {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAdminAccessToken()}`,
  });
  return headers;
}

// TODO: get normal user access token or admin token
export function getHeaders(): HttpHeaders {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAdminAccessToken()}`,
  });
  return headers;
}

export function getFormDataAdminHeaders(): HttpHeaders {
  const headers = new HttpHeaders({
    // 'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${getAdminAccessToken()}`,
  });
  return headers;
}


export function getEnumArray(enumType: any) {
  let result = [];
  for (var enumMember in enumType) {
    result.push(enumMember);
  }
  return result;
}

export function isMobile() {
  return window.innerWidth <= 900;
}

export function getLang(): string {
  if (localStorage) {
    return localStorage['lang'] || '';
  } else {
    return '';
  }
}

export function setLang(language: string) {
  if (localStorage) {
    localStorage['lang'] = language;
  }
}
