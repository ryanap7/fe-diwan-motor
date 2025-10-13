// Development token for testing
// This token should be replaced with proper authentication flow in production
export const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlZjdmM2I4Yi1lM2I3LTRhMDctYTdkOS00NDA1YjcxNmYyNWMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDM5MTU5NSwiZXhwIjoxNzYwOTk2Mzk1fQ.pYe5zSHp8Krs-oBIuNJbGm4j_4lVWIf6P7B_xxMyAy8';

// Function to set dev token in localStorage for testing
export const setDevToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', DEV_TOKEN);
    localStorage.setItem('user', JSON.stringify({
      userId: 'ef7f3b8b-e3b7-4a07-a7d9-4405b716f25c',
      username: 'admin',
      email: 'admin@company.com',
      role: 'ADMIN'
    }));
    console.log('✅ Development token set in localStorage');
  }
};