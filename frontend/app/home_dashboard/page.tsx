'use client'

import { useState } from "react";
import HomeCard from "@/components/home-dashboard/homecard";
import { Button } from "@/components/ui/button"; // Import shadcn button
import "@/app/globals.css";
import { FaPlus, FaChevronDown, FaExclamationCircle, FaFlag, FaUser, FaChartBar, FaClipboardList, FaFolderOpen, FaTrash, FaColumns, FaTh, FaEllipsisH, FaMinus, FaWindowClose, FaCalendarAlt, FaTasks } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Page() {
  const [cardStates, setCardStates] = useState([
    { title: "Activity", hasContent: false },
    { title: "Agenda", hasContent: false },
    { title: "My Work", hasContent: false },
    { title: "Assigned to me", hasContent: false },
  ]);

  const [showCalendar, setShowCalendar] = useState(false);
  const toggleCalendarPopup = () => {
    setShowCalendar((prev) => !prev); // Toggle the calendar popup visibility
  };

  const handleAddContent = (index: number) => {
    setCardStates((prevStates) =>
      prevStates.map((card, i) =>
        i === index ? { ...card, hasContent: true } : card
      )
    );
  };
  const CreateButton = ({ onRemoveCard }: { onRemoveCard?: () => void }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          
            <FaEllipsisH size={16} className="cursor-pointer text-gray-500" />

        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border shadow-lg rounded-md p-1">
          <DropdownMenuItem
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100 p-2 rounded-md"
            onClick={onRemoveCard || (() => alert("Remove card clicked"))} // Use callback if provided, fallback to default
          >
            <FaTrash className="text-gray-500" size={14} />
            <span>Remove card</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const [sections, setSections] = useState([
    {
      id: 1,
      title: "In progress",
      tasks: [
        {
          name: "Landing Page",
          assignees: ["MP", "MP"],
          deadline: "16. Jul at 12:30",
          statusIcon: <FaExclamationCircle className="text-green-500" />,
        },
      ],
      isOpen: true,
    },
    {
      id: 2,
      title: "Dev. In progress",
      tasks: [
        {
          name: "Landing Page",
          assignees: ["MP", "MP"],
          deadline: "16. Jul at 12:30",
          statusIcon: <FaExclamationCircle className="text-green-500" />,
          subTask: "Sub task comes here",
        },
      ],
      isOpen: true,
    },
  ]);

  const toggleSection = (id: number) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id ? { ...section, isOpen: !section.isOpen } : section
      )
    );
  };


  const cardData = [
    {
      title: "Activity",
      description: "This is your home for tasks updates and team activities",
      content: cardStates[0].hasContent ? (
        <ul className="space-y-4">
          <li className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaFolderOpen className="text-gray-500" />
              <strong>Projects:</strong>
            </div>
            <span className="text-sm text-gray-500">
              You created subtask: "Create a hi-fi prototype for user flow"
            </span>
            <span className="text-sm text-gray-400">Oct 23rd at 12:30</span>
          </li>
          <hr />
          <li className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaClipboardList className="text-gray-500" />
              <strong>Design Team:</strong>
            </div>
            <span className="text-sm text-gray-500">
              You created subtask: "Review wireframe designs"
            </span>
            <span className="text-sm text-gray-400">Oct 24th at 10:00</span>
          </li>
          <hr />
          <li className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaChartBar className="text-gray-500" />
              <strong>Dashboard:</strong>
            </div>
            <span className="text-sm text-gray-500">
              You created subtask: "Analyze metrics for Q4"
            </span>
            <span className="text-sm text-gray-400">Oct 25th at 15:45</span>
          </li>
        </ul>
      ) : null,
      emptyState: (
        <div className="flex flex-col items-center justify-center space-y-4">
          <FaTasks className="text-purple-500 text-4xl" /> {/* Clipboard Icon */}
          <p className="text-gray-500 text-center">
            This is your home for tasks updates and team activities.
          </p>
          <Button
            variant="default"
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl" 
            onClick={() => handleAddContent(0)}
          >
            Create a Task
          </Button>
        </div>
      ),
      topRightIcons: [
        <FaMinus size={16} className="text-gray-500" />,
        <FaWindowClose size={16} />,
        <CreateButton />,
      ],
    },
    {
      title: "Agenda",
      description: "Here you can book meetings and view all booked meetings",
      content: cardStates[1].hasContent ? (
        <div className="space-y-4">
          {/* Date Navigation */}
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-sm border-b-2 border-purple-500 focus:outline-none">Dec 5, 2024</span>
            <div className="flex items-center space-x-2">
              <button className="p-1 pt-0 pb-0">
                <span className="text-lg">&lt;</span>
              </button>
              <button className="p-1 pt-0 pb-0">
                <span className="text-lg">&gt;</span>
              </button>
            </div>
          </div>
          <hr />

          {/* Agenda Items */}
          <ul className="space-y-4">
            <li className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" />
                <div>
                  <p className="font-semibold">Dec 17, Tue</p>
                  <p className="text-sm text-gray-500">Weekly check up</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Oct 23th at 12:30</span>
            </li>
          </ul>
        </div>
      ) : null,
      emptyState: (
        <div className="flex flex-col items-center justify-center space-y-4">
          <FaCalendarAlt className="text-purple-500 text-4xl" onClick={toggleCalendarPopup}/> {/* Calendar icon */}
          <p className="text-gray-500 text-center">
            Here you can book meetings and view all booked meetings.
          </p>
          <Button
            variant="outline"
            className="bg-purple-500 hover:bg-purple-400 text-white rounded-xl"
            onClick={() => handleAddContent(1)}
          >
            Add Event
          </Button>
        </div>
      ),
      topRightIcons: [
        <FaCalendarAlt size={16} onClick={toggleCalendarPopup}/>,
        <CreateButton />,
      ],
    },
    {
      title: "My Work",
      description: "You can find all your work updates here",
      content: cardStates[2].hasContent ? (
        <div>
          {/* Tab Navigation */}
          <div className="flex space-x-4 border-b pb-2">
            <button className="text-black font-semibold border-b-2 border-purple-500 focus:outline-none">
              To do
            </button>
            <button className="text-gray-500 focus:outline-none">Done</button>
            <button className="text-gray-500 focus:outline-none">Delegated</button>
          </div>

          {/* To Do Section */}
          <div className="space-y-6 mt-2.5">
            {/* Today Section */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-lg">▼</span>
                <strong className="text-gray-700">Today</strong>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">
                  You created subtask: "Create a hi-fi prototype for user flow"
                </span>
                <span className="text-yellow-500 text-sm">Oct 23th at 12:30</span>
              </div>
            </div>
            <hr />

            {/* Overdue Section */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-lg">▼</span>
                <strong className="text-gray-700">Overdue</strong>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">
                  You created subtask: "Create a hi-fi prototype for user flow"
                </span>
                <span className="text-red-500 text-sm">Oct 23th at 12:30</span>
              </div>
            </div>
          </div>
        </div>
      ) : null,
      emptyState: (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-gray-500 text-center">
            Your work updates will appear here.
          </p>
          <Button
            variant="default"
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl" 
            onClick={() => handleAddContent(2)}
          >
            Update My Work
          </Button>
        </div>
      ),
      topRightIcons: [
        <FaMinus size={16} />,
        <FaWindowClose size={16} />,
        <CreateButton />,
      ],
    },
    {
      title: "Assigned to me",
      description: "Tasks assigned to you by your team",
      content: cardStates[3].hasContent ? (
        <div className="space-y-4">
          {/* Top Buttons */}
          <div className="flex space-x-4 mb-4">
            <Button variant="outline" className="text-sm rounded-xl">
              Status
            </Button>
            <Button variant="outline" className="text-sm rounded-xl">
              Collapse all
            </Button>
            <Button variant="outline" className="text-sm rounded-xl">
              Columns
            </Button>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <div key={section.id} className="border-b pb-4">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaChevronDown
                    className={`cursor-pointer transition-transform ${section.isOpen ? "rotate-0" : "-rotate-90"}`}
                    onClick={() => toggleSection(section.id)}
                  />
                  <span className="px-2 py-1 text-sm bg-purple-400 text-white rounded-md">{section.title}</span>
                </div>
                <button className="flex items-center space-x-1 text-sm text-gray-500">
                  <FaPlus size={12} />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Tasks */}
              {section.isOpen &&
                section.tasks.map((task, index) => (
                  <div key={index} className="pl-6 pt-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {task.statusIcon}
                        <div>
                          <p className="font-semibold">{task.name}</p>
                          <p className="text-sm text-gray-500">{task.subTask || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {/* Assignees */}
                        <div className="flex -space-x-2">
                          {task.assignees.map((assignee, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-blue-300 flex items-center justify-center text-white text-xs"
                            >
                              {assignee}
                            </div>
                          ))}
                        </div>
                        {/* Deadline */}
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <FaFlag className="text-red-500" />
                          <span>Deadline: {task.deadline}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
      ))}
    </div>
      ) : null,
      emptyState: (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-gray-500 text-center">
            You currently don’t have any assigned tasks.
          </p>
          <Button
            variant="default"
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl" 
            onClick={() => handleAddContent(3)}
          >
            Get a Task
          </Button>
        </div>
      ),
      topRightIcons: [
        <FaMinus size={16} />,
        <FaWindowClose size={16} />,
        <CreateButton />,
      ],
    },

  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold pb-3">Good morning User,</h1>
          <p className="text-gray-500">Let's take a look at your tasks for today</p>
        </div>

        <div className="flex flex-col items-start space-y-4 text-right pr-4">
          <div className="flex items-center space-x-2">
            <FaColumns size={20} className="text-gray-500" />
            <span className="text-gray-500">Project name:</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaTh size={20} className="text-gray-500" />
            <span className="text-gray-500">Other info:</span>
          </div>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <CalendarPopup onClose={toggleCalendarPopup} />
          </div>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
        {cardData.map((card, index) => (
          <HomeCard
            key={index}
            title={card.title}
            description={card.description}
            content={card.content}
            emptyState={card.emptyState}
            topRightIcons={card.topRightIcons}
          />
        ))}
      </div>
    </div>
  );
}
