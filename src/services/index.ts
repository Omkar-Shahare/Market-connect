// Main services export file
export * from './api';
export * from './vendorApi';
export * from './supplierApi';

// Re-export common types and functions
export { checkServerHealth, API_BASE_URL, ApiError } from './api';
export { vendorApi } from './vendorApi';
export { supplierApi } from './supplierApi';

// Service health check utility
export async function checkBackendConnection(): Promise<boolean> {
  try {
    const { checkServerHealth } = await import('./api');
    const result = await checkServerHealth();
    console.log('✅ Backend connection successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}
