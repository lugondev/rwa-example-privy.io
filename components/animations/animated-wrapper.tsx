import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedWrapperProps {
  children: React.ReactNode
  className?: string
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce'
  duration?: number
  delay?: number
  once?: boolean
}

/**
 * Animation variants for different effects
 */
const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1
    },
    exit: { opacity: 0, scale: 0.3 }
  }
}

/**
 * Animated wrapper component for dynamic loading
 * Reduces initial bundle size by lazy loading Framer Motion
 */
const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({ 
  children, 
  className,
  animation = 'fadeIn',
  duration = 0.3,
  delay = 0,
  once = true
}) => {
  const variants = animationVariants[animation]
  
  // Special transition for bounce animation
  const getTransition = () => {
    if (animation === 'bounce') {
      return {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
        delay
      }
    }
    return {
      duration,
      delay,
      ease: "easeOut" as const
    }
  }
  
  return (
    <motion.div
      className={className}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={getTransition()}
      viewport={{ once }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Animated list component for staggered animations
 */
export const AnimatedList: React.FC<{
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
}> = ({ children, className, staggerDelay = 0.1 }) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

/**
 * Page transition component
 */
export const PageTransition: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default AnimatedWrapper