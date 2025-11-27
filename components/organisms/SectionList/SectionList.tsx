import React from 'react';
import { FlatList, View, RefreshControl } from 'react-native';
import { Text } from '../../atoms';
import { EmptyState } from '../../molecules';
import { DesignTokens } from '../../../constants/DesignSystem';

interface SectionData {
  title: string;
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
}

interface SectionListProps {
  sections: SectionData[];
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyState?: {
    title: string;
    subtitle?: string;
    icon?: string;
    actionTitle?: string;
    onAction?: () => void;
  };
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  refreshing = false,
  onRefresh,
  emptyState,
}) => {
  const hasData = sections.some(section => section.data.length > 0);

  const renderSection = (section: SectionData, sectionIndex: number) => (
    <View key={`section-${sectionIndex}`} style={{ marginBottom: DesignTokens.spacing.lg }}>
      
      <Text 
        variant="h4" 
        weight="semibold"
        style={{ 
          marginBottom: DesignTokens.spacing.md,
          paddingHorizontal: DesignTokens.spacing.md 
        }}
      >
        {section.title}
      </Text>
      
      <View style={{ gap: DesignTokens.spacing.sm }}>
        {section.data.map((item, itemIndex) => (
          <View key={`item-${sectionIndex}-${itemIndex}`}>
            {section.renderItem(item, itemIndex)}
          </View>
        ))}
      </View>
      
    </View>
  );

  if (!hasData && emptyState) {
    return (
      <EmptyState
        title={emptyState.title}
        subtitle={emptyState.subtitle}
        icon={emptyState.icon}
        actionTitle={emptyState.actionTitle}
        onAction={emptyState.onAction}
      />
    );
  }

  return (
    <FlatList
      data={sections.filter(section => section.data.length > 0)}
      renderItem={({ item, index }) => renderSection(item, index)}
      keyExtractor={(_, index) => `section-${index}`}
      contentContainerStyle={{ 
        padding: DesignTokens.spacing.md,
        paddingBottom: DesignTokens.spacing.xl 
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
};
