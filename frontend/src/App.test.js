import { render, screen } from '@testing-library/react';
import App from '../App';
import { BrowserRouter } from 'react-router-dom';

// Mock the API calls to avoid network errors during tests
jest.mock('../services/api', () => ({
    login: jest.fn(),
    register: jest.fn(),
    getLessons: jest.fn(),
}));

test('renders login page by default', () => {
    // We need to wrap App in Router if it wasn't already, but App has Router inside. 
    // However, testing App directly might be tricky if it has its own Router.
    // Let's test a simple component instead or render App.

    // Since App.js has <Router>, we can just render <App />.
    render(<App />);
    const linkElement = screen.getByText(/Tiny Teacher Login/i);
    expect(linkElement).toBeInTheDocument();
});
