import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { MdDragIndicator } from "react-icons/md"; // Import drag indicator icon

interface HomeCardProps {
  title: string;
  description: string;
  content?: React.ReactNode; // Optional content for the card
  footer?: React.ReactNode; // Optional footer for the card
  emptyState?: React.ReactNode; // Render when there's no content
  className?: string; // Optional custom class for the card
  height?: string; // Optional height for the card
  topRightIcons?: React.ReactNode[]; // Array of icons for the top-right corner
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
}) => {
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
              {topRightIcons.map((icon, index) => (
                <span key={index} className="text-gray-500">
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-4 space-y-4 h-48 overflow-y-auto">
          {/* Ensure content or empty state renders here */}
          {content ? content : emptyState ? emptyState : <p>No content available</p>}
        </CardContent>

        {/* Footer */}
        {footer && <CardFooter className="p-4 border-t mt-4">{footer}</CardFooter>}
      </Card>
    </div>
  );
};

export default HomeCard;




  
  
  