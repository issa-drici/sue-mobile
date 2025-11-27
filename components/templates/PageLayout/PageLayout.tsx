import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, View, ViewStyle } from 'react-native';
import { DesignTokens } from '../../../constants/DesignSystem';
import { CommonStyles } from '../../../styles/CommonStyles';
import { Header } from '../../organisms';

interface PageLayoutProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
  refreshControl?: React.ReactElement;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  backgroundColor?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightAction,
  children,
  scrollable = false,
  refreshControl,
  style,
  contentStyle,
  headerStyle,
  statusBarStyle = 'dark-content',
  backgroundColor = DesignTokens.colors.background,
}) => {
  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={[{ flex: 1 }, contentStyle]}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[{ flex: 1 }, contentStyle]}>
        {children}
      </View>
    );
  };

  return (
    <SafeAreaView style={[CommonStyles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      
      <Header
        title={title}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
        rightAction={rightAction}
        style={headerStyle}
      />
      
      {renderContent()}
    </SafeAreaView>
  );
};
