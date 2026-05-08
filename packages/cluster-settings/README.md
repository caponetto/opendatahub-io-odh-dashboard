# @odh-dashboard/cluster-settings

Cluster Settings admin page for ODH Dashboard.

Provides the "General settings" page under Settings > Cluster settings, including:

- PVC size defaults
- Notebook culler timeout
- Usage data collection (telemetry)
- Model serving platform toggles
- Model deployment strategy

## Usage

This package is an extension plugin. Add it to an assembler's `pluginPackages` to include it.

```json
{
  "pluginPackages": ["@odh-dashboard/cluster-settings"]
}
```
