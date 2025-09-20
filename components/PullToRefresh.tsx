import { BrandColors } from '@/constants/Colors';
import React, { useRef } from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';

interface PullToRefreshProps extends Omit<RefreshControlProps, 'colors' | 'tintColor' | 'title' | 'titleColor' | 'progressViewOffset'> {
  refreshing: boolean;
  onRefresh: () => void;
  color?: string;
  progressViewOffset?: number;
}

/**
 * Composant PullToRefresh uniforme pour toute l'application
 * 
 * Ce composant fournit une expérience de rafraîchissement cohérente
 * avec les couleurs de l'application, des messages en français
 * et des animations smooth pour une meilleure UX.
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({ 
  refreshing, 
  onRefresh, 
  color = BrandColors.primary,
  progressViewOffset = 0,
  ...props 
}) => {
  const lastRefreshTime = useRef(0);
  
  // Protection supplémentaire contre les déclenchements multiples
  const handleRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.current;
    
    // Éviter les déclenchements trop rapprochés (moins de 500ms)
    if (timeSinceLastRefresh < 500) {
      return;
    }
    
    if (!refreshing) {
      lastRefreshTime.current = now;
      onRefresh();
    }
  };

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={[color]}
      tintColor={color}
      title="Tirez pour rafraîchir"
      titleColor={color}
      progressViewOffset={progressViewOffset}
      // Améliorations pour une animation plus smooth
      progressBackgroundColor="transparent"
      // Animation plus douce et stable
      {...props}
    />
  );
};

export default PullToRefresh; 