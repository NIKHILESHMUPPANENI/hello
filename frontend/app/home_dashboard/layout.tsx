import React from "react";
import TaskManagementSidebar from "../components/layout/TaskManagementSidebar";
import TaskManagementNavbar from "../components/layout/TaskManagementNavbar";

export const metadata = {
  title: "Home Dashboard",
  description: "A sample dashboard with a sidebar and navbar for home page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <TaskManagementSidebar />

        {/* Main Content */}
        <div className="flex-grow">
          {/* Navbar */}
          <TaskManagementNavbar />

          {/* Dynamic Content */}
          <main className="p-4 pt-2">{children}</main>
        </div>
      </body>
    </html>
  );
}
