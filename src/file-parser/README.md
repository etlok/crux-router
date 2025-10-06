# File Parser Module

This module provides a validation mechanism for JSON files that need to follow a specific structure. It uses class-validator and class-transformer to ensure that all incoming JSON data matches the expected schema.

## Structure

The expected JSON structure is:

```json
[
  {
    "event": "<unique name for the event>",
    "config": {
      "websocket_method": ""
    },
    "middleware": ["<middleware key>"],
    "actions": [
      {
        "type": "execute_workflow",
        "workflow": "",
        "config": {
          "channel_id": ""
        }
      }
    ]
  }
]
```

## Features

- Strict validation of JSON structure
- Detailed error messages when validation fails
- Support for file-based and direct JSON parsing
- Sample data for testing

## Usage

### Import the module

```typescript
import { FileParserModule } from './file-parser/file-parser.module';

@Module({
  imports: [
    // ... other modules
    FileParserModule,
  ],
})
export class AppModule {}
```

### Inject the service

```typescript
import { FileParserService } from './file-parser/file-parser.service';

@Injectable()
export class YourService {
  constructor(private readonly fileParserService: FileParserService) {}

  async yourMethod() {
    // Parse a file
    const events = await this.fileParserService.parseFile('/path/to/file.json');
    
    // Or parse JSON content directly
    const jsonContent = `[{"event":"test","config":{"websocket_method":"test"},"middleware":["auth"],"actions":[{"type":"execute_workflow","workflow":"test","config":{"channel_id":"test"}}]}]`;
    const eventsFromContent = await this.fileParserService.parseAndValidateContent(jsonContent);
    
    // Use the validated events
    for (const event of events) {
      // Do something with the event
    }
  }
}
```

### API Endpoints

- `POST /file-parser/parse` - Parse and validate JSON content
- `GET /file-parser/sample` - Load and validate a sample file

## Testing

You can use the provided HTML file (`file-parser-test.html`) to test the validation:
1. Start your NestJS server
2. Open the HTML file in a browser
3. Use the buttons to test different validation scenarios
