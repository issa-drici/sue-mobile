declare module 'react-native-swipeable-row' {
  import React from 'react';
    import { ViewStyle } from 'react-native';

  interface SwipeableRowProps {
    children: React.ReactNode;
    renderActions: () => React.ReactNode;
    actionWidth?: number;
    style?: ViewStyle;
  }

  const SwipeableRow: React.FC<SwipeableRowProps>;
  export default SwipeableRow;
}







