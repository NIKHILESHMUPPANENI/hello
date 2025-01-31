"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

interface PopupCalendarProps {
  onClose: () => void;
  onAddAgendaContent?: (date: string, time: string) => void;
}

export function PopupCalendar({ onClose, onAddAgendaContent }: PopupCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("13:30");
  const [open, setOpen] = useState(true); // 
  
  const handleAdd = () => {
    if (date && time && onAddAgendaContent) {
      onAddAgendaContent(date.toLocaleDateString(), time);
    }
    onClose();
  };

  const times = Array.from({ length: 27 }, (_, i) => {
    const hours = Math.floor((7 * 60 + i * 30) / 60);
    const minutes = (7 * 60 + i * 30) % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  });

  return (
    <Popover open={open} onOpenChange={(state) => {
      console.log("Popover open state changed:", state);
      setOpen(state);
      if (!state) onClose(); // ✅ Only close if state is false
    }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" onClick={() => setOpen(true)}>Open Calendar</Button>
      </PopoverTrigger>
      {/* Centered Popover Content */}
      <PopoverContent className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="w-[480px] h-[570px] bg-white shadow-xl p-6 rounded-2xl border border-gray-300">
          {/* Header */}
          <h2 className="text-lg font-semibold mb-2">Event title <span className="text-red-500">*</span></h2>
          <p className="text-gray-500 text-sm mb-4">Pick a due date</p>

          {/* Date & Time Selection Layout */}
          <div className="flex space-x-6">
            {/* Calendar Section */}
            <div className="w-[420px]">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow hover:bg-gray-300"
              />
            </div>

            {/* Time Selection */}
            <div className="w-[140px] border rounded-md p-2 h-[280px] overflow-y-auto shadow-inner bg-white">
              {times.map((t) => (
                <div
                  key={t}
                  className={`cursor-pointer p-2 text-center rounded-md hover:bg-gray-200 ${
                    time === t ? "bg-purple-300 font-semibold" : ""
                  }`}
                  onClick={() => setTime(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Project Deadline Section */}
          <div className="mt-6 border-t pt-4">
            <p className="font-semibold text-lg">Project deadline</p>
            <div className="flex items-center justify-between mt-3">
              {/* Due Date */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" />
                <p className="text-gray-700">Due date:</p>
                <div className="border px-3 py-1 rounded-md text-gray-500">{date ? date.toLocaleDateString() : "DD/MM/YYYY"}</div>
              </div>

              {/* Hour */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" />
                <p className="text-gray-700">Hour:</p>
                <div className="border px-3 py-1 rounded-md text-gray-500">{time}</div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end mt-6 space-x-4">
            <Button variant="outline" className="rounded-xl px-6" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-500 hover:bg-purple-400 text-white px-6 rounded-xl" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
