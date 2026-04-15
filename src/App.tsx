import { AuthProvider } from './contexts/AuthContext';
import { CustomRouters } from './Routers';

function App() {
  return (
    <AuthProvider>
      <CustomRouters />
    </AuthProvider>
  );
}

export default App;
