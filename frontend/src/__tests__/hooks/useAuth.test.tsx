import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import * as api from '@/services/api';

// Mock the API
jest.mock('@/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock socket service
jest.mock('@/services/socket', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with unauthenticated state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
  });

  it('should login successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      createdAt: '2023-01-01',
    };
    const mockToken = 'mock-token';

    mockedApi.authAPI.login.mockResolvedValue({
      data: { user: mockUser, token: mockToken },
    } as any);

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial load

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('should handle login failure', async () => {
    const mockError = new Error('Invalid credentials');
    mockedApi.authAPI.login.mockRejectedValue(mockError);

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial load

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('should register successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      createdAt: '2023-01-01',
    };
    const mockToken = 'mock-token';

    mockedApi.authAPI.register.mockResolvedValue({
      data: { user: mockUser, token: mockToken },
    } as any);

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial load

    await act(async () => {
      await result.current.register('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('should logout successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      createdAt: '2023-01-01',
    };
    const mockToken = 'mock-token';

    mockedApi.authAPI.login.mockResolvedValue({
      data: { user: mockUser, token: mockToken },
    } as any);

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    await waitForNextUpdate(); // Wait for initial load

    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('should restore session from localStorage', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      createdAt: '2023-01-01',
    };
    const mockToken = 'stored-token';

    localStorageMock.getItem.mockReturnValue(mockToken);
    mockedApi.authAPI.profile.mockResolvedValue({
      data: mockUser,
    } as any);

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
  });

  it('should handle invalid stored token', async () => {
    const mockToken = 'invalid-token';

    localStorageMock.getItem.mockReturnValue(mockToken);
    mockedApi.authAPI.profile.mockRejectedValue(new Error('Invalid token'));

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });
});