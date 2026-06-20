import { Navigate, Outlet, useLocation } from 'react-router-dom';

const DEFAULT_ROLE = 'consultor';
const PREFERENCES_ROUTE = '/consultor/preferencias';

const getStoredLoginData = () => {
  const storedLoginData = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');
  if (!storedLoginData) {
    return null;
  }

  try {
    return JSON.parse(storedLoginData);
  } catch {
    return null;
  }
};

const normalizeRoles = (rolesValue) => {
  const rawRoles = Array.isArray(rolesValue)
    ? rolesValue
    : typeof rolesValue === 'string'
      ? rolesValue.split(';')
      : [];

  const parsedRoles = rawRoles
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);

  const uniqueRoles = [...new Set(parsedRoles)];
  return uniqueRoles.length > 0 ? uniqueRoles : [DEFAULT_ROLE];
};

function ConsultorPreferencesGuard() {
  const location = useLocation();
  const loginData = getStoredLoginData();

  if (!loginData) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  }

  const userRoles = normalizeRoles(loginData.roles ?? loginData.role);
  if (!userRoles.includes(DEFAULT_ROLE)) {
    return <Outlet />;
  }

  const isPreferencesRoute = location.pathname.startsWith(PREFERENCES_ROUTE);
  if (isPreferencesRoute || loginData.hasPreferences) {
    return <Outlet />;
  }

  return <Navigate to={PREFERENCES_ROUTE} replace state={{ from: location.pathname }} />;
}

export default ConsultorPreferencesGuard;
