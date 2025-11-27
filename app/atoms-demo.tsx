import React, { useState } from 'react';
import { View } from 'react-native';
import { 
  Button, PrimaryButton, SecondaryButton, OutlineButton, GhostButton, DangerButton,
  Text, Heading1, Heading2, Heading3, Heading4, Subtitle, Body, Caption,
  Icon, BackIcon, SearchIcon, AddIcon, HeartIcon, StarIcon,
  Input, OutlinedInput, FilledInput,
  Avatar, SmallAvatar, LargeAvatar,
  Spinner, LoadingSpinner, LargeSpinner
} from '../components/atoms';
import { BackScreenLayout } from '../components/ui/ScreenLayout';
import { DevOnly } from '../components/DevOnly';
import { DesignTokens } from '../constants/DesignSystem';

export default function AtomsDemoScreen() {
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <DevOnly>
      <BackScreenLayout title="Atoms Demo" scrollable horizontalPadding="md">
      
      <View style={{ marginBottom: DesignTokens.spacing.xl }}>
        <Heading3 style={{ marginBottom: DesignTokens.spacing.md }}>Buttons</Heading3>
        
        <View style={{ gap: DesignTokens.spacing.sm }}>
          <PrimaryButton title="Primary Button" onPress={() => {}} />
          <SecondaryButton title="Secondary Button" onPress={() => {}} />
          <OutlineButton title="Outline Button" onPress={() => {}} />
          <GhostButton title="Ghost Button" onPress={() => {}} />
          <DangerButton title="Danger Button" onPress={() => {}} />
          
          <View style={{ flexDirection: 'row', gap: DesignTokens.spacing.sm }}>
            <Button title="Small" size="sm" onPress={() => {}} />
            <Button title="Medium" size="md" onPress={() => {}} />
            <Button title="Large" size="lg" onPress={() => {}} />
          </View>
          
          <Button title="Loading..." loading onPress={() => {}} />
          <Button title="Disabled" disabled onPress={() => {}} />
          <Button title="Full Width" fullWidth onPress={() => {}} />
        </View>
      </View>

      <View style={{ marginBottom: DesignTokens.spacing.xl }}>
        <Heading3 style={{ marginBottom: DesignTokens.spacing.md }}>Typography</Heading3>
        
        <View style={{ gap: DesignTokens.spacing.xs }}>
          <Heading1>Heading 1</Heading1>
          <Heading2>Heading 2</Heading2>
          <Heading3>Heading 3</Heading3>
          <Heading4>Heading 4</Heading4>
          <Subtitle>Subtitle text</Subtitle>
          <Body>Body text for regular content</Body>
          <Caption>Caption text for small details</Caption>
          
          <Text variant="body" color="secondary">Secondary color</Text>
          <Text variant="body" color="error">Error color</Text>
          <Text variant="body" color="success">Success color</Text>
          <Text variant="body" weight="bold">Bold weight</Text>
          <Text variant="body" align="center">Centered text</Text>
        </View>
      </View>

      <View style={{ marginBottom: DesignTokens.spacing.xl }}>
        <Heading3 style={{ marginBottom: DesignTokens.spacing.md }}>Icons</Heading3>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DesignTokens.spacing.md }}>
          <BackIcon size="lg" />
          <SearchIcon size="lg" />
          <AddIcon size="lg" />
          <HeartIcon size="lg" color="error" />
          <StarIcon size="lg" color="warning" />
          
          <Icon name="calendar" size="lg" />
          <Icon name="location" size="lg" />
          <Icon name="people" size="lg" />
          <Icon name="notifications" size="lg" />
          <Icon name="settings" size="lg" />
        </View>
        
        <View style={{ flexDirection: 'row', gap: DesignTokens.spacing.sm, marginTop: DesignTokens.spacing.md }}>
          <Icon name="home" size="xs" />
          <Icon name="home" size="sm" />
          <Icon name="home" size="md" />
          <Icon name="home" size="lg" />
          <Icon name="home" size="xl" />
          <Icon name="home" size="xxl" />
        </View>
      </View>

      <View style={{ marginBottom: DesignTokens.spacing.xl }}>
        <Heading3 style={{ marginBottom: DesignTokens.spacing.md }}>Inputs</Heading3>
        
        <View style={{ gap: DesignTokens.spacing.md }}>
          <Input
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Default input"
            leftIcon="person"
          />
          
          <OutlinedInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Outlined input"
            leftIcon="mail"
          />
          
          <FilledInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Filled input"
            leftIcon="search"
          />
          
          <Input
            value={passwordValue}
            onChangeText={setPasswordValue}
            placeholder="Password"
            leftIcon="lock-closed"
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            secureTextEntry={!showPassword}
          />
          
          <Input
            value=""
            onChangeText={() => {}}
            placeholder="Error state"
            error
            leftIcon="alert-circle"
          />
          
          <Input
            value=""
            onChangeText={() => {}}
            placeholder="Disabled"
            disabled
            leftIcon="person"
          />
        </View>
      </View>

      <View style={{ marginBottom: DesignTokens.spacing.xl }}>
        <Heading3 style={{ marginBottom: DesignTokens.spacing.md }}>Avatars</Heading3>
        
        <View style={{ flexDirection: 'row', gap: DesignTokens.spacing.md, alignItems: 'center' }}>
          <Avatar initials="JS" size="xs" />
          <SmallAvatar initials="AB" />
          <Avatar initials="CD" size="md" />
          <Avatar initials="EF" size="lg" />
          <LargeAvatar initials="GH" />
          <Avatar initials="IJ" size="xxl" />
        </View>
        
        <View style={{ flexDirection: 'row', gap: DesignTokens.spacing.md, alignItems: 'center', marginTop: DesignTokens.spacing.md }}>
          <Avatar source={require('../assets/images/icon-avatar.png')} size="sm" />
          <Avatar source={require('../assets/images/icon-avatar.png')} size="md" />
          <Avatar source={require('../assets/images/icon-avatar.png')} size="lg" />
        </View>
      </View>

      <View style={{ marginBottom: DesignTokens.spacing.xl }}>
        <Heading3 style={{ marginBottom: DesignTokens.spacing.md }}>Spinners</Heading3>
        
        <View style={{ gap: DesignTokens.spacing.md }}>
          <Spinner />
          <LoadingSpinner />
          <LargeSpinner />
          <Spinner color="secondary" message="Loading data..." />
          <Spinner size="large" color="primary" message="Please wait..." />
        </View>
      </View>

      </BackScreenLayout>
    </DevOnly>
  );
}
