import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "../navigation/AppSidebar";
import PomodoroDoneModal from "../dashboard/PomodoroDoneModal";
import { usePomodoroStore } from "../../store/usePomodoroStore";

const AppLayout = () => {
  const tick = usePomodoroStore((state) => state.tick);

  useEffect(() => {
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [tick]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#05070b] text-white">
      <AppSidebar />

      <main className="relative min-h-0 flex-1 overflow-y-auto bg-[#070b12]">
        <Outlet />
      </main>
      <PomodoroDoneModal />
    </div>
  );
};

export default AppLayout;
