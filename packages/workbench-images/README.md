# @odh-dashboard/workbench-images

Workbench Images (BYON) admin page for ODH Dashboard.

Provides the "Workbench images" page under Settings > Environment setup, allowing administrators to manage custom notebook images including:

- Import and manage BYON (Bring Your Own Notebook) images
- Configure image dependencies and display metadata
- Associate hardware profiles with images
- Enable/disable images

## Usage

This package is an extension plugin. Add it to an assembler's `pluginPackages` to include it.

```json
{
  "pluginPackages": ["@odh-dashboard/workbench-images"]
}
```
