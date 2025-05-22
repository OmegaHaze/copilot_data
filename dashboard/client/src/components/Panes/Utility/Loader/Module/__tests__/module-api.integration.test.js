/**
 * module-api.integration.test.js
 * Integration tests for centralized module-api.js
 */

import { 
  fetchModules,
  registerModule,
  fetchModulesByType,
  resetModuleDatabase,
  clearModuleDatabase,
  getModuleById,
  updateModule,
  deleteModule,
  syncModulesToBackend
} from '../module-api';

// Mock module-registration for syncModulesToBackend tests
jest.mock('../module-registration', () => ({
  syncActiveModulesToBackend: jest.fn().mockResolvedValue({
    success: true,
    modules: [{ id: 'SYSTEM-TestPane-123', result: { id: 1 } }],
    errors: []
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Module API Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('fetchModules()', () => {
    it('should request modules from the correct endpoint', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ SYSTEM: [], SERVICE: [], USER: [] })
      });

      // Execute
      await fetchModules();

      // Verify
      expect(fetch).toHaveBeenCalledWith('/api/modules', expect.any(Object));
    });

    it('should handle errors gracefully', async () => {
      // Setup
      fetch.mockRejectedValueOnce(new Error('Network error'));
      console.error = jest.fn();

      // Execute
      const result = await fetchModules();

      // Verify
      expect(result).toHaveProperty('SYSTEM');
      expect(result).toHaveProperty('SERVICE');
      expect(result).toHaveProperty('USER');
      expect(result).toHaveProperty('_error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('fetchModulesByType()', () => {
    it('should request modules of specific type', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      // Execute
      await fetchModulesByType('SYSTEM');

      // Verify
      expect(fetch).toHaveBeenCalledWith('/api/modules?module_type=SYSTEM', expect.any(Object));
    });
  });

  describe('registerModule()', () => {
    it('should register a module with the correct type and data', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-id', success: true })
      });

      const moduleData = {
        name: 'Test Module',
        paneComponent: 'TestPane'
      };

      // Execute
      await registerModule('SYSTEM', moduleData);

      // Verify
      expect(fetch).toHaveBeenCalledWith(
        '/api/modules/system',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(moduleData)
        })
      );
    });
  });

  describe('resetModuleDatabase()', () => {
    it('should call the reset endpoint', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Execute
      await resetModuleDatabase();

      // Verify
      expect(fetch).toHaveBeenCalledWith(
        '/api/modules/reset-db',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });
  
  describe('clearModuleDatabase()', () => {
    it('should call the clear endpoint', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Execute
      await clearModuleDatabase();

      // Verify
      expect(fetch).toHaveBeenCalledWith(
        '/api/modules/clear-db',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('getModuleById()', () => {
    it('should fetch a module by its ID and type', async () => {
      // Setup
      const mockModule = { id: 1, name: 'Test Module', moduleType: 'SYSTEM' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModule
      });

      // Execute
      const result = await getModuleById('SYSTEM', 1);

      // Verify
      expect(fetch).toHaveBeenCalledWith(
        '/api/modules/system/1',
        expect.any(Object)
      );
      expect(result).toEqual(mockModule);
    });

    it('should return null when module is not found', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Execute
      const result = await getModuleById('SYSTEM', 999);

      // Verify
      expect(result).toBeNull();
    });
  });

  describe('updateModule()', () => {
    it('should update a module with correct data', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Updated Module' })
      });

      const updateData = { name: 'Updated Module' };

      // Execute
      await updateModule('SYSTEM', 1, updateData);

      // Verify
      expect(fetch).toHaveBeenCalledWith(
        '/api/modules/system/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
    });

    it('should handle update errors', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Module not found'
      });

      // Execute
      const result = await updateModule('SYSTEM', 999, { name: 'Test' });

      // Verify
      expect(result).toBeNull();
    });
  });

  describe('deleteModule()', () => {
    it('should delete a module by ID and type', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Execute
      const result = await deleteModule('SYSTEM', 1);

      // Verify
      expect(fetch).toHaveBeenCalledWith(
        '/api/modules/system/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(result).toBe(true);
    });

    it('should handle delete errors', async () => {
      // Setup
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Module not found'
      });

      // Execute
      const result = await deleteModule('SYSTEM', 999);

      // Verify
      expect(result).toBe(false);
    });
  });

  describe('syncModulesToBackend()', () => {
    it('should synchronize active modules with the backend', async () => {
      // Execute
      const result = await syncModulesToBackend(['SYSTEM-TestPane-123']);

      // Verify
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('modules');
      expect(result).toHaveProperty('errors');
    });

    it('should handle empty modules list', async () => {
      // Execute
      const result = await syncModulesToBackend([]);

      // Verify
      expect(result).toHaveProperty('success', false);
      expect(result.message).toContain('No active modules');
    });
  });
});
