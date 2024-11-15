# @tailor-cms/config-parser

## Usage

```js
const { getSchemaApi, getWorkflowApi, processSchemas } = require('@tailor-cms/config-parser');
```

## API

### getSchemaApi(SCHEMAS)
> The method returning an object containing schema helper methods.

Methods:
- getSchemaId
- getSchema
- getLevel
- getOutlineLevels
- isOutlineActivity
- getOutlineChildren
- filterOutlineActivities
- isTrackedInWorkflow
- getRepositoryMetadata
- getActivityLabel
- getActivityMetadata
- getElementMetadata
- getLevelRelationships
- getRepositoryRelationships
- getSiblingTypes
- getSupportedContainers
- getContainerTemplateId
- isEditable

### getWorkflowApi(WORKFLOWS, schemaApi)
> The method returning an object containing workflow properties and methods.

Properties:
- priorities

Methods:
- getWorkflow
- getPriority
- getDefaultWorkflowStatus
- getDefaultActivityStatus

### processSchemas(SCHEMAS)
> The method which validates schemas, prefixes activity types with schema ID, e.g. `SCHEMA_ID/TYPE`, 
> and processes meta.
