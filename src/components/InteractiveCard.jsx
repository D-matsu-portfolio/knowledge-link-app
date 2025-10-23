import { motion } from 'framer-motion';
import { Card } from 'react-bootstrap';

const cardVariants = {
  hover: {
    scale: 1.03,
    transition: {
      type: 'spring',
      stiffness: 300,
    },
  },
  tap: {
    scale: 0.98,
  },
};

const InteractiveCard = ({ children, className, ...props }) => {
  return (
    <motion.div
      whileHover="hover"
      whileTap="tap"
      variants={cardVariants}
      className={className}
      {...props}
    >
      <Card className="h-100">
        {children}
      </Card>
    </motion.div>
  );
};

export default InteractiveCard;
