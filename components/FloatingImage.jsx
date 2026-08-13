'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

// A floating object photo (cat, headphones, vinyl, etc.) with a slow idle
// float and a slightly stronger lift + rotate on hover.
export default function FloatingImage({
  src,
  alt,
  width,
  height,
  className = '',
  rotate = 0,
  floatDelay = 0,
}) {
  return (
    <motion.div
      className={className}
      style={{ rotate }}
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: floatDelay,
      }}
      whileHover={{ scale: 1.05, rotate: rotate + 4 }}
    >
      <Image src={src} alt={alt} width={width} height={height} priority />
    </motion.div>
  );
}