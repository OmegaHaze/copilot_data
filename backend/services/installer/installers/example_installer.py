# Example module installer template
# Save this as {module_name}_installer.py in the backend/services/installers directory

# Module information function - this should return metadata about the module
def get_example_info():
    """
    Return information about the example module
    
    Note: Replace "example" with your module's name in the function name
    """
    return {
        "name": "example",  # Unique identifier for the module
        "display_name": "Example Module",  # User-friendly name
        "description": "An example module that demonstrates the installer template",
        "version": "1.0.0",
        "category": "utilities",  # Category for grouping in UI
        "author": "Your Name",
        "website": "https://example.com",
        "logoUrl": "/icons/example.png",  # Path to module icon
        "dependencies": []  # List of other modules this depends on
    }

# Module installation function
def install_example(config=None):
    """
    Install the example module
    
    Args:
        config: Optional configuration parameters from the frontend
        
    Returns:
        Dictionary with installation results and module configuration
    """
    # This is where you'd put actual installation logic:
    # - Download required files
    # - Install dependencies
    # - Set up directories
    # - Configure services
    
    # Return a dictionary with module configuration
    return {
        "description": "Example module that demonstrates the installer template",
        "category": "utilities",
        "paneComponent": "ExamplePane",  # React component that renders this module
        "defaultSize": "medium",  # small, medium, large, xlarge
        "visible": True,  # Whether to show in module list
        "supportsStatus": True,  # Whether this module reports status
        "socketNamespace": "/example",  # Socket.io namespace for real-time updates
        "autostart": False,  # Whether to auto-start services
        "logoUrl": "/icons/example.png",
        
        # Define any services this module provides
        "services": [
            {
                "name": "example-service",
                "description": "Example service for demonstration",
                "path": "/path/to/service/executable",
                "autostart": False,
                "visible": True,
                "supportsStatus": True,
                "socketNamespace": "/example-service"
            }
        ],
        
        # You can return any additional data needed by the frontend
        "custom_data": {
            "endpoint": "http://localhost:8000",
            "api_key": "example_key"
        }
    }

# Module uninstallation function (optional)
def uninstall_example():
    """
    Clean up when uninstalling the module
    
    Note: Replace "example" with your module's name in the function name
    """
    # This is where you'd put cleanup logic:
    # - Remove installed files
    # - Stop and remove services
    # - Delete configuration files
    
    # This function doesn't need to return anything, as errors will be caught
    # by the main uninstaller
    pass
