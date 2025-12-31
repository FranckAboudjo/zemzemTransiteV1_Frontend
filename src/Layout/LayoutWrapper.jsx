import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";

const LayoutWrapper = () => {
  return (
    <DashboardLayout>
      <Outlet />{" "}
      {/* C'est ici que les pages (Dashboard, Users, etc.) s'afficheront */}
    </DashboardLayout>
  );
};

export default LayoutWrapper;
