import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPanel } from '../components/AdminPanel';
import { api } from '../api/axios';
import '@testing-library/jest-dom';

// Mock axios
jest.mock('../api/axios');
const mockedApi = api as jest.Mocked<typeof api>;

describe('AdminPanel', () => {
    const mockOrders = [
        { id: 1, username: 'user1', isPaid: true, isCollected: false },
        { id: 2, username: 'user2', isPaid: false, isCollected: false }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.get.mockResolvedValue({ data: mockOrders });
    });

    it('renders orders table', async () => {
        render(<AdminPanel />);

        // Wait for orders to load
        await waitFor(() => {
            expect(screen.getByText('user1')).toBeInTheDocument();
            expect(screen.getByText('user2')).toBeInTheDocument();
        });

        // Check status display
        expect(screen.getByText('Оплачено')).toBeInTheDocument();
        expect(screen.getByText('Не оплачено')).toBeInTheDocument();
    });

    it('handles marking order as collected', async () => {
        mockedApi.post.mockResolvedValueOnce({});
        
        render(<AdminPanel />);

        // Wait for orders to load
        await waitFor(() => {
            expect(screen.getByText('user1')).toBeInTheDocument();
        });

        // Find and click the collect button
        const collectButton = screen.getByText('Отметить как полученное');
        fireEvent.click(collectButton);

        // Verify API call
        await waitFor(() => {
            expect(mockedApi.post).toHaveBeenCalledWith('/api/admin/orders/1/collect');
        });
    });

    it('handles API error when fetching orders', async () => {
        mockedApi.get.mockRejectedValueOnce(new Error('Failed to fetch'));
        
        render(<AdminPanel />);

        // Wait for error message
        await waitFor(() => {
            expect(screen.getByText(/Error fetching orders/i)).toBeInTheDocument();
        });
    });
}); 