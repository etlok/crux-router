# Quick Implementation Guide for Middleware Validator

## Immediate Actions to Take

### 1. Create New Repository
```bash
# Create new repository
git init crux-middleware-validator
cd crux-middleware-validator

# Initial structure
mkdir -p {api/src/{controllers,services,types,utils},cli/src/commands,shared/{interfaces,validators},examples}
```

### 2. Core Interface Definition (shared/interfaces/middleware.interface.ts)
```typescript
export interface CruxMiddleware {
  // Metadata
  name: string;
  version: string;
  description?: string;
  author?: string;
  
  // Core execution
  execute(context: MiddlewareContext): Promise<MiddlewareResult>;
  
  // Optional lifecycle hooks
  onInit?(): Promise<void>;
  onError?(error: Error, context: MiddlewareContext): Promise<void>;
  onCleanup?(): Promise<void>;
  
  // Configuration
  config?: MiddlewareConfig;
}

export interface MiddlewareContext {
  event: any;
  metadata: Record<string, any>;
  session?: any;
  user?: any;
  requestId: string;
  timestamp: Date;
  logger: Logger;
}

export interface MiddlewareResult {
  success: boolean;
  data?: any;
  error?: string;
  next: boolean; // Continue to next middleware
  modified?: boolean; // Context was modified
}
```

### 3. Validation Service (api/src/services/middleware-validator.service.ts)
```typescript
export class MiddlewareValidatorService {
  
  async validateMiddleware(filePath: string): Promise<ValidationResult> {
    const results: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      performance: null,
      security: null
    };
    
    // 1. Syntax validation
    await this.validateSyntax(filePath, results);
    
    // 2. Interface compliance
    await this.validateInterface(filePath, results);
    
    // 3. Security checks
    await this.validateSecurity(filePath, results);
    
    // 4. Runtime testing
    await this.testRuntime(filePath, results);
    
    return results;
  }
  
  private async validateSyntax(filePath: string, results: ValidationResult) {
    // TypeScript compilation check
    // ESLint validation
    // Import/export validation
  }
  
  private async validateInterface(filePath: string, results: ValidationResult) {
    // Check required methods exist
    // Validate method signatures
    // Check return types
  }
  
  private async validateSecurity(filePath: string, results: ValidationResult) {
    // Scan for dangerous patterns
    // Check for unauthorized operations
    // Validate input sanitization
  }
  
  private async testRuntime(filePath: string, results: ValidationResult) {
    // Execute with mock data
    // Test error handling
    // Performance benchmarking
  }
}
```

### 4. CLI Tool (cli/src/commands/validate.ts)
```typescript
export class ValidateCommand {
  async execute(middlewarePath: string, options: ValidateOptions) {
    const spinner = ora('Validating middleware...').start();
    
    try {
      // Upload to validator service
      const result = await this.apiClient.validateMiddleware(middlewarePath);
      
      spinner.stop();
      
      // Display results
      this.displayResults(result);
      
      // Exit with appropriate code
      process.exit(result.valid ? 0 : 1);
      
    } catch (error) {
      spinner.fail('Validation failed');
      console.error(error.message);
      process.exit(1);
    }
  }
  
  private displayResults(result: ValidationResult) {
    console.log(chalk.bold('\n🔍 Middleware Validation Results\n'));
    
    if (result.valid) {
      console.log(chalk.green('✅ Middleware is valid!'));
    } else {
      console.log(chalk.red('❌ Middleware has issues:'));
      result.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
    }
    
    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }
    
    if (result.performance) {
      console.log(chalk.blue('\n📊 Performance:'));
      console.log(`  Execution time: ${result.performance.executionTime}ms`);
      console.log(`  Memory usage: ${result.performance.memoryUsage}MB`);
    }
  }
}
```

### 5. Template Generator (cli/src/commands/template.ts)
```typescript
export class TemplateCommand {
  private templates = {
    authentication: `
import { CruxMiddleware, MiddlewareContext, MiddlewareResult } from '@crux/types';

export class {{className}} implements CruxMiddleware {
  name = '{{name}}';
  version = '1.0.0';
  description = '{{description}}';
  
  async execute(context: MiddlewareContext): Promise<MiddlewareResult> {
    try {
      // Your authentication logic here
      const token = context.event.headers?.authorization;
      
      if (!token) {
        return {
          success: false,
          error: 'No authorization token provided',
          next: false
        };
      }
      
      // Validate token
      const user = await this.validateToken(token);
      
      // Add user to context
      context.user = user;
      
      return {
        success: true,
        next: true,
        modified: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        next: false
      };
    }
  }
  
  private async validateToken(token: string): Promise<any> {
    // Implement token validation
    throw new Error('Token validation not implemented');
  }
  
  async onError(error: Error, context: MiddlewareContext): Promise<void> {
    context.logger.error('Authentication middleware error:', error);
  }
}
`,
    validation: `
import { CruxMiddleware, MiddlewareContext, MiddlewareResult } from '@crux/types';

export class {{className}} implements CruxMiddleware {
  name = '{{name}}';
  version = '1.0.0';
  description = '{{description}}';
  
  async execute(context: MiddlewareContext): Promise<MiddlewareResult> {
    try {
      // Your validation logic here
      const errors = this.validateEvent(context.event);
      
      if (errors.length > 0) {
        return {
          success: false,
          error: \`Validation failed: \${errors.join(', ')}\`,
          next: false
        };
      }
      
      return {
        success: true,
        next: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        next: false
      };
    }
  }
  
  private validateEvent(event: any): string[] {
    const errors: string[] = [];
    
    // Add your validation rules
    if (!event.payload) {
      errors.push('payload is required');
    }
    
    return errors;
  }
}
`
  };

  async generate(type: string, name: string, outputPath: string) {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Template type '${type}' not found`);
    }

    const className = this.toPascalCase(name);
    const content = template
      .replace(/{{className}}/g, className)
      .replace(/{{name}}/g, name)
      .replace(/{{description}}/g, `${type} middleware for ${name}`);

    fs.writeFileSync(outputPath, content);
    console.log(chalk.green(`✅ Generated ${type} middleware: ${outputPath}`));
  }
}
```

## Customer Usage Examples

### 1. Basic Workflow
```bash
# Install CLI
npm install -g @crux/middleware-cli

# Create new middleware project
crux-mw init my-custom-auth
cd my-custom-auth

# Generate authentication middleware template
crux-mw template authentication my-auth --output ./src/my-auth.middleware.ts

# Edit the middleware file...

# Validate locally
crux-mw validate ./src/my-auth.middleware.ts

# Test with sample data
crux-mw test ./src/my-auth.middleware.ts --scenarios auth-scenarios.json

# Check performance
crux-mw benchmark ./src/my-auth.middleware.ts

# Generate documentation
crux-mw docs ./src/ --output ./README.md
```

### 2. CI/CD Integration
```yaml
# .github/workflows/middleware-validation.yml
name: Validate Middleware
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Crux CLI
        run: npm install -g @crux/middleware-cli
        
      - name: Validate All Middlewares
        run: |
          for file in src/**/*.middleware.ts; do
            echo "Validating $file"
            crux-mw validate "$file" --report junit --output "reports/$(basename "$file").xml"
          done
          
      - name: Test Middlewares
        run: |
          crux-mw test src/ --scenarios test/scenarios/ --coverage
          
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: validation-reports
          path: reports/
```

### 3. Integration Testing
```typescript
// test/integration.test.ts
import { MiddlewareTester } from '@crux/middleware-cli';

describe('My Custom Auth Middleware', () => {
  const tester = new MiddlewareTester();

  beforeEach(async () => {
    await tester.loadMiddleware('./src/my-auth.middleware.ts');
  });

  it('should authenticate valid token', async () => {
    const result = await tester.execute({
      event: {
        headers: {
          authorization: 'Bearer valid-token'
        }
      },
      metadata: {},
      requestId: 'test-123'
    });

    expect(result.success).toBe(true);
    expect(result.next).toBe(true);
  });

  it('should reject invalid token', async () => {
    const result = await tester.execute({
      event: {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      }
    });

    expect(result.success).toBe(false);
    expect(result.next).toBe(false);
  });
});
```

This approach provides:
1. **Early validation** before deployment
2. **Standardized interface** compliance
3. **Security scanning** for unsafe patterns
4. **Performance testing** to avoid bottlenecks
5. **Template generation** for quick starts
6. **CI/CD integration** for automated validation
7. **Documentation generation** for better maintenance

The separate repository keeps your main Crux Router focused while giving customers powerful tools to develop and test their middleware independently.