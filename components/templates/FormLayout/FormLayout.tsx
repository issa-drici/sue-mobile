import React from 'react';
import { View, ViewStyle, ScrollView } from 'react-native';
import { PageLayout } from '../PageLayout';
import { FormField } from '../../molecules';
import { Button, Text } from '../../atoms';
import { DesignTokens } from '../../../constants/DesignSystem';

interface FormField {
  key: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}

interface FormSection {
  title?: string;
  subtitle?: string;
  fields: FormField[];
}

interface FormLayoutProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  sections: FormSection[];
  onFieldChange: (key: string, value: string) => void;
  onSubmit: () => void;
  submitTitle?: string;
  submitLoading?: boolean;
  submitDisabled?: boolean;
  secondaryAction?: {
    title: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  sections,
  onFieldChange,
  onSubmit,
  submitTitle = 'Valider',
  submitLoading = false,
  submitDisabled = false,
  secondaryAction,
  style,
  contentStyle,
}) => {
  const getKeyboardType = (type?: string) => {
    switch (type) {
      case 'email': return 'email-address';
      case 'number': return 'numeric';
      default: return 'default';
    }
  };

  const getAutoCapitalize = (type?: string) => {
    switch (type) {
      case 'email': return 'none';
      case 'password': return 'none';
      default: return 'sentences';
    }
  };

  const renderSection = (section: FormSection, sectionIndex: number) => (
    <View key={`section-${sectionIndex}`} style={{ marginBottom: DesignTokens.spacing.xl }}>
      
      {section.title && (
        <Text 
          variant="h3" 
          weight="semibold"
          style={{ marginBottom: DesignTokens.spacing.xs }}
        >
          {section.title}
        </Text>
      )}
      
      {section.subtitle && (
        <Text 
          variant="body" 
          color="secondary"
          style={{ marginBottom: DesignTokens.spacing.lg }}
        >
          {section.subtitle}
        </Text>
      )}
      
      <View style={{ gap: DesignTokens.spacing.md }}>
        {section.fields.map((field) => (
          <FormField
            key={field.key}
            label={field.label}
            value={field.value}
            onChangeText={(value) => onFieldChange(field.key, value)}
            placeholder={field.placeholder}
            required={field.required}
            error={field.error}
            leftIcon={field.leftIcon}
            rightIcon={field.rightIcon}
            onRightIconPress={field.onRightIconPress}
            secureTextEntry={field.type === 'password'}
            keyboardType={getKeyboardType(field.type)}
            autoCapitalize={getAutoCapitalize(field.type)}
            autoComplete={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'off'}
          />
        ))}
      </View>
      
    </View>
  );

  const renderActions = () => (
    <View style={{
      padding: DesignTokens.spacing.lg,
      gap: DesignTokens.spacing.md,
      borderTopWidth: 1,
      borderTopColor: DesignTokens.colors.border,
      backgroundColor: DesignTokens.colors.background,
    }}>
      
      <Button
        title={submitTitle}
        onPress={onSubmit}
        loading={submitLoading}
        disabled={submitDisabled || submitLoading}
        fullWidth
      />
      
      {secondaryAction && (
        <Button
          title={secondaryAction.title}
          variant="ghost"
          onPress={secondaryAction.onPress}
          fullWidth
        />
      )}
      
    </View>
  );

  return (
    <PageLayout
      title={title}
      showBackButton={showBackButton}
      onBackPress={onBackPress}
      style={style}
    >
      <View style={[{ flex: 1 }, contentStyle]}>
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: DesignTokens.spacing.lg,
            paddingBottom: 0,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, index) => renderSection(section, index))}
        </ScrollView>
        
        {renderActions()}
        
      </View>
    </PageLayout>
  );
};
