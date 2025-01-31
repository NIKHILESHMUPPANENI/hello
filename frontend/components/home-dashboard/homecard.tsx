"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { MdDragIndicator } from "react-icons/md"; // Import drag indicator icon
import { PopupCalendar } from "./calendarpopup";
import { Button } from "@/components/ui/button";
import { FaCalendarAlt } from "react-icons/fa";

interface HomeCardProps {
  title: string;
  description: string;
  content?: React.ReactNode; 
  footer?: React.ReactNode; 
  emptyState?: React.ReactNode; 
  className?: string; 
  height?: string; 
  topRightIcons?: React.ReactNode[]; 
  onAddAgendaContent?: (date: string, time: string) => void; 
}

const HomeCard: React.FC<HomeCardProps> = ({
  title,
  description,
  content,
  footer,
  emptyState,
  className = "",
  height = "h-72",
  topRightIcons = [],
  onAddAgendaContent,
}) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="relative rounded-xl p-[1.3px] bg-gradient-to-b from-black to-purple-400">
      <Card
        className={`relative border border-transparent rounded-xl bg-white shadow-lg transition-shadow duration-300 ${className} ${height}`}
      >
        {/* Header */}
        <CardHeader className="p-4 border-b flex flex-col">
          {/* First Line - Six-dot Icon */}
          <div className="flex">
            <MdDragIndicator size={20} className="text-gray-500" />
          </div>

          {/* Second Line - Title and Top-right Icons */}
          <div className="flex justify-between items-center mt-2">
            {/* Title */}
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>

            {/* Top-right Icons */}
            <div className="flex space-x-3">
            {topRightIcons.map((icon, index) => {
                // If the icon is FaCalendarAlt, attach onClick to open popup
                if (React.isValidElement(icon) && icon.type === FaCalendarAlt) {
                  return (
                    <Button key={index} variant="ghost" onClick={() => {
                      console.log("Calendar icon clicked, opening popup...");
                      setShowPopup((prev) => {
                        console.log("Previous showPopup state:", prev);
                        return true;
                        
                      });
                    }}>
                      <FaCalendarAlt size={16} className="text-gray-500" />
                    </Button>
                  );
                }
                return (
                  <span key={index} className="text-gray-500">
                    {icon}
                  </span>
                );
              })}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-4 pt-2 space-y-4 h-48 overflow-y-auto">
          {/* Ensure content or empty state renders here */}
          {content ? content : emptyState ? emptyState : <p>No content available</p>}
        </CardContent>

        {/* Footer */}
        {footer && <CardFooter className="p-4 border-t mt-4">{footer}</CardFooter>}
      </Card>

 
      {showPopup && <PopupCalendar onClose={() => setShowPopup(false)} onAddAgendaContent={onAddAgendaContent} />}
    </div>
  );
};

export default HomeCard;



