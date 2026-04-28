import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, action }) => {
  return (
    <motion.div 
      className="empty-state-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-state-visual">
        <div className="blob-gradient" />
        <Icon size={48} className="main-icon" />
        <motion.div 
          className="sparkle-one"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={20} />
        </motion.div>
      </div>
      
      <h3>{title}</h3>
      <p>{message}</p>
      
      {action && (
        <button className="premium-btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
