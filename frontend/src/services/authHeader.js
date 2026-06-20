export default function authHeader() {
  const loginData = JSON.parse(sessionStorage.getItem('loginData') || localStorage.getItem('loginData') || 'null');

  if (loginData && loginData.token) {
    return { Authorization: 'Bearer ' + loginData.token };
  } else {
    return {};
  }
}
