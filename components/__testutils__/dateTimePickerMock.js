/* Mock de @react-native-community/datetimepicker : élément hôte portant ses props. */
/* eslint-disable @typescript-eslint/no-require-imports */
const React = require('react');
const DateTimePicker = (props) => React.createElement('DateTimePicker', props);
module.exports = { __esModule: true, default: DateTimePicker, DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() } };
