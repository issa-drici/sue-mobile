import React from 'react';
import DebugConfig from '../components/DebugConfig';
import { DevOnly } from '../components/DevOnly';

export default function DebugScreen() {
  return (
    <DevOnly>
      <DebugConfig />
    </DevOnly>
  );
}







