import { render, screen } from '@testing-library/react';
import App from './demo/App';
import { Box } from '@mui/joy';

test('renders learn react link', () => {
  render(<Box />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
