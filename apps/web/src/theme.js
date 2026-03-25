import { createTheme } from '@mantine/core';

const brand = [
  '#eef2ff',
  '#e0e7ff',
  '#c7d2fe',
  '#a5b4fc',
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#3730a3',
  '#312e81',
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: { brand },
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  black: '#182132',
  components: {
    Button:  { defaultProps: { radius: 'md' } },
    Modal:   { defaultProps: { radius: 'lg', centered: true } },
    Paper:   { defaultProps: { radius: 'lg', withBorder: true } },
    TextInput:     { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select:        { defaultProps: { radius: 'md' } },
    Textarea:      { defaultProps: { radius: 'md' } },
    NumberInput:   { defaultProps: { radius: 'md' } },
    DateInput:     { defaultProps: { radius: 'md' } },
  },
});
