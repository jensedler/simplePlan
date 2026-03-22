import Toolbar from './Toolbar';
import Timeline from './Timeline';
import ProjectDialog from './ProjectDialog';
import { useStore } from '../store';

export default function PlannerApp() {
  const { dialog } = useStore();

  return (
    <div className="planner-app">
      <Toolbar />
      <Timeline />
      {dialog.mode && <ProjectDialog />}
    </div>
  );
}
