import { useEffect } from 'react';
import { useStore } from './store';
import Login from './components/Login';
import PlannerApp from './components/PlannerApp';

export default function App() {
  const { isAuthenticated, needsSetup, init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!isAuthenticated) {
    return <Login needsSetup={needsSetup} />;
  }

  return <PlannerApp />;
}
