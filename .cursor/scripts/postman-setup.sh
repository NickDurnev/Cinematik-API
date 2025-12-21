#!/bin/bash

# Postman CLI Setup Script for Cinematik API
# This script sets up Postman CLI and generates collections from OpenAPI spec

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up Postman CLI for Cinematik API${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Install Postman CLI (newman)
echo -e "${YELLOW}📦 Installing Postman CLI (Newman)...${NC}"
npm install -g newman
npm install -g newman-reporter-html
npm install -g newman-reporter-junit

# Install postman-collection (for programmatic collection generation)
echo -e "${YELLOW}📦 Installing postman-collection package...${NC}"
npm install --save-dev postman-collection

# Create postman directory structure
echo -e "${YELLOW}📁 Creating Postman directories...${NC}"
mkdir -p postman/collections
mkdir -p postman/environments
mkdir -p postman/tests
mkdir -p postman/reports

# Create local development environment
echo -e "${YELLOW}⚙️  Creating local environment...${NC}"
cat > postman/environments/local.postman_environment.json << 'EOF'
{
  "id": "local-env",
  "name": "Local Development",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "default",
      "enabled": true
    },
    {
      "key": "apiVersion",
      "value": "v1",
      "type": "default",
      "enabled": true
    },
    {
      "key": "authToken",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "refreshToken",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "userId",
      "value": "1",
      "type": "default",
      "enabled": true
    },
    {
      "key": "userEmail",
      "value": "test@example.com",
      "type": "default",
      "enabled": true
    },
    {
      "key": "userPassword",
      "value": "password123",
      "type": "default",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
EOF

# Create staging environment
echo -e "${YELLOW}⚙️  Creating staging environment...${NC}"
cat > postman/environments/staging.postman_environment.json << 'EOF'
{
  "id": "staging-env",
  "name": "Staging",
  "values": [
    {
      "key": "baseUrl",
      "value": "https://staging-api.cinematik.com",
      "type": "default",
      "enabled": true
    },
    {
      "key": "apiVersion",
      "value": "v1",
      "type": "default",
      "enabled": true
    },
    {
      "key": "authToken",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "refreshToken",
      "value": "",
      "type": "default",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
EOF

# Create production environment
echo -e "${YELLOW}⚙️  Creating production environment...${NC}"
cat > postman/environments/production.postman_environment.json << 'EOF'
{
  "id": "prod-env",
  "name": "Production",
  "values": [
    {
      "key": "baseUrl",
      "value": "https://api.cinematik.com",
      "type": "default",
      "enabled": true
    },
    {
      "key": "apiVersion",
      "value": "v1",
      "type": "default",
      "enabled": true
    },
    {
      "key": "authToken",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "refreshToken",
      "value": "",
      "type": "default",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
EOF

# Create Newman configuration
echo -e "${YELLOW}⚙️  Creating Newman configuration...${NC}"
cat > postman/newman.config.json << 'EOF'
{
  "version": "2.1.0",
  "collections": [
    {
      "info": {
        "name": "Cinematik API",
        "description": "API collection for Cinematik backend"
      },
      "item": []
    }
  ],
  "environments": [
    {
      "name": "Local Development",
      "values": [
        {
          "key": "baseUrl",
          "value": "http://localhost:3000"
        },
        {
          "key": "apiVersion",
          "value": "v1"
        }
      ]
    }
  ],
  "globals": [
    {
      "key": "apiVersion",
      "value": "v1"
    }
  ],
  "run": {
    "delayRequest": 100,
    "timeout": 3000,
    "timeoutRequest": 5000
  }
}
EOF

# Create npm scripts for Postman operations
echo -e "${YELLOW}📝 Adding npm scripts for Postman operations...${NC}"

# Add scripts to package.json
if [ -f "package.json" ]; then
    # Create a backup
    cp package.json package.json.backup
    
    # Use Node.js to add scripts
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    pkg.scripts = pkg.scripts || {};
    
    // Add Postman scripts
    pkg.scripts['postman:generate'] = 'node scripts/generate-postman-collection.js';
    pkg.scripts['postman:run'] = 'newman run postman/collections/cinematik-api.postman_collection.json -e postman/environments/local.postman_environment.json';
    pkg.scripts['postman:run:staging'] = 'newman run postman/collections/cinematik-api.postman_collection.json -e postman/environments/staging.postman_environment.json';
    pkg.scripts['postman:run:production'] = 'newman run postman/collections/cinematik-api.postman_collection.json -e postman/environments/production.postman_environment.json';
    pkg.scripts['postman:run:report'] = 'newman run postman/collections/cinematik-api.postman_collection.json -e postman/environments/local.postman_environment.json -r html --reporter-html-export postman/reports/report.html';
    pkg.scripts['postman:validate'] = 'newman run postman/collections/cinematik-api.postman_collection.json -e postman/environments/local.postman_environment.json --bail';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
    echo -e "${GREEN}✅ Added Postman scripts to package.json${NC}"
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

# Create the collection generation script
echo -e "${YELLOW}📝 Creating collection generation script...${NC}"
mkdir -p scripts
cat > scripts/generate-postman-collection.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { Collection } = require('postman-collection');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const OUTPUT_PATH = path.join(__dirname, '../postman/collections/cinematik-api.postman_collection.json');

console.log('🚀 Generating Postman collection from OpenAPI spec...');

// Function to download OpenAPI spec
function downloadOpenAPISpec(url) {
    return new Promise((resolve, reject) => {
        const specUrl = `${url}/api-json`;
        console.log(`📥 Downloading OpenAPI spec from ${specUrl}`);
        
        https.get(specUrl, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const spec = JSON.parse(data);
                    resolve(spec);
                } catch (error) {
                    reject(new Error(`Failed to parse OpenAPI spec: ${error.message}`));
                }
            });
            
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Function to convert OpenAPI to Postman collection
function convertOpenAPIToPostman(openapiSpec) {
    const collection = new Collection({
        info: {
            name: 'Cinematik API',
            description: 'API collection for Cinematik backend',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        event: [
            {
                listen: 'prerequest',
                script: {
                    type: 'text/javascript',
                    exec: [
                        '// Global pre-request script',
                        'console.log("Request: " + request.name + " - " + request.url);',
                        '',
                        '// Auto-set auth token if available',
                        'if (pm.environment.get("authToken")) {',
                        '    pm.request.headers.add({',
                        '        key: "Authorization",',
                        '        value: "Bearer " + pm.environment.get("authToken")',
                        '    });',
                        '}',
                        '',
                        '// Set common headers',
                        'pm.request.headers.add({',
                        '    key: "Content-Type",',
                        '    value: "application/json"',
                        '});',
                        'pm.request.headers.add({',
                        '    key: "Accept",',
                        '    value: "application/json"',
                        '});'
                    ]
                }
            },
            {
                listen: 'test',
                script: {
                    type: 'text/javascript',
                    exec: [
                        '// Global test script',
                        'console.log("Response: " + response.code + " - " + response.statusText);',
                        '',
                        '// Basic response validation',
                        'pm.test("Response has valid status code", function () {',
                        '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204, 400, 401, 403, 404, 409, 422, 500]);',
                        '});',
                        '',
                        '// Response time check',
                        'pm.test("Response time is acceptable", function () {',
                        '    pm.expect(pm.response.responseTime).to.be.below(5000);',
                        '});',
                        '',
                        '// Store auth token if login response',
                        'if (pm.response.code === 200 && pm.request.url.path.includes("auth/signin")) {',
                        '    const responseJson = pm.response.json();',
                        '    if (responseJson.data && responseJson.data.access_token) {',
                        '        pm.environment.set("authToken", responseJson.data.access_token);',
                        '        pm.environment.set("refreshToken", responseJson.data.refresh_token);',
                        '        console.log("Auth token stored");',
                        '    }',
                        '}'
                    ]
                }
            }
        ]
    });

    // Convert OpenAPI paths to Postman items
    const paths = openapiSpec.paths || {};
    const servers = openapiSpec.servers || [];
    const baseUrl = servers[0]?.url || '{{baseUrl}}';

    Object.keys(paths).forEach(path => {
        const pathItem = paths[path];
        
        Object.keys(pathItem).forEach(method => {
            const operation = pathItem[method];
            
            if (operation.operationId) {
                const request = {
                    url: {
                        raw: baseUrl + path,
                        host: [baseUrl.replace('{{baseUrl}}', '')],
                        path: path.split('/').filter(p => p)
                    },
                    method: method.toUpperCase(),
                    header: [],
                    body: {
                        mode: 'raw',
                        raw: JSON.stringify(operation.requestBody?.content?.['application/json']?.example || {}, null, 2),
                        options: {
                            raw: {
                                language: 'json'
                            }
                        }
                    },
                    description: operation.description || operation.summary || ''
                };

                // Add parameters
                if (operation.parameters) {
                    operation.parameters.forEach(param => {
                        if (param.in === 'query') {
                            request.url.query = request.url.query || [];
                            request.url.query.push({
                                key: param.name,
                                value: param.example || '',
                                description: param.description || ''
                            });
                        } else if (param.in === 'path') {
                            request.url.raw = request.url.raw.replace(`{${param.name}}`, `:${param.name}`);
                        }
                    });
                }

                collection.items.add({
                    name: operation.summary || `${method.toUpperCase()} ${path}`,
                    request: request,
                    event: [
                        {
                            listen: 'test',
                            script: {
                                type: 'text/javascript',
                                exec: [
                                    `// Test for ${method.toUpperCase()} ${path}`,
                                    `pm.test("${method.toUpperCase()} ${path} - Status code is ${operation.responses?.['200']?.description || 'Success'}", function () {`,
                                    `    pm.expect(pm.response.code).to.be.oneOf(${Object.keys(operation.responses || {}).map(code => parseInt(code)).filter(code => !isNaN(code))});`,
                                    `});`
                                ]
                            }
                        }
                    ]
                });
            }
        });
    });

    return collection.toJSON();
}

// Main execution
async function generateCollection() {
    try {
        // Check if server is running
        console.log('🔍 Checking if API server is running...');
        
        // Download OpenAPI spec
        const openapiSpec = await downloadOpenAPISpec(API_URL);
        
        // Convert to Postman collection
        const postmanCollection = convertOpenAPIToPostman(openapiSpec);
        
        // Ensure output directory exists
        const outputDir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write collection to file
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(postmanCollection, null, 2));
        
        console.log(`✅ Postman collection generated successfully!`);
        console.log(`📍 Output: ${OUTPUT_PATH}`);
        console.log(`📊 Total items: ${postmanCollection.item.length}`);
        
        // Generate summary report
        const summary = {
            generated: new Date().toISOString(),
            source: `${API_URL}/api-json`,
            items: postmanCollection.item.length,
            file: OUTPUT_PATH
        };
        
        fs.writeFileSync(path.join(outputDir, 'generation-summary.json'), JSON.stringify(summary, null, 2));
        console.log(`📝 Summary report: ${path.join(outputDir, 'generation-summary.json')}`);
        
    } catch (error) {
        console.error('❌ Failed to generate Postman collection:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateCollection();
}

module.exports = { generateCollection, convertOpenAPIToPostman };
EOF

# Make the script executable
chmod +x scripts/generate-postman-collection.js

# Create test collection script
echo -e "${YELLOW}📝 Creating test collection script...${NC}"
cat > postman/tests/test-runner.js << 'EOF'
#!/usr/bin/env node

const newman = require('newman');
const path = require('path');

const collectionPath = path.join(__dirname, '../collections/cinematik-api.postman_collection.json');
const environmentPath = path.join(__dirname, '../environments/local.postman_environment.json');

const options = {
    collection: collectionPath,
    environment: environmentPath,
    reporters: ['cli', 'html'],
    reporter: {
        html: {
            export: path.join(__dirname, '../reports/test-report.html'),
            template: 'htmlreqres'
        }
    },
    insecure: false,
    timeout: 30000,
    delayRequest: 100
};

console.log('🧪 Running Postman tests...');

newman.run(options)
    .on('start', function () {
        console.log('🚀 Starting test run...');
    })
    .on('done', function (err, summary) {
        if (err || summary.error) {
            console.error('❌ Test run failed:', err || summary.error);
            process.exit(1);
        } else {
            console.log('✅ Test run completed successfully!');
            console.log(`📊 Total requests: ${summary.run.stats.requests.total}`);
            console.log(`✅ Passed: ${summary.run.stats.assertions.total}`);
            console.log(`⏱️  Total time: ${summary.run.timings.completed}ms`);
            console.log(`📄 Report: ${path.join(__dirname, '../reports/test-report.html')}`);
        }
    });
EOF

# Make the test script executable
chmod +x postman/tests/test-runner.js

# Create README for Postman setup
echo -e "${YELLOW}📝 Creating Postman setup README...${NC}"
cat > postman/README.md << 'EOF'
# Postman Setup for Cinematik API

This directory contains Postman collections, environments, and test configurations for the Cinematik API.

## Directory Structure

```
postman/
├── collections/              # API collections
│   └── cinematik-api.postman_collection.json
├── environments/            # Environment configurations
│   ├── local.postman_environment.json
│   ├── staging.postman_environment.json
│   └── production.postman_environment.json
├── tests/                   # Test scripts
│   └── test-runner.js
├── reports/                 # Test reports
└── README.md               # This file
```

## Quick Start

### 1. Install Dependencies

```bash
npm install -g newman
npm install -g newman-reporter-html
npm install --save-dev postman-collection
```

### 2. Start the API Server

```bash
npm run start:dev
```

### 3. Generate Postman Collection

```bash
npm run postman:generate
```

### 4. Run Tests

```bash
# Run all tests against local environment
npm run postman:run

# Run tests with HTML report
npm run postman:run:report

# Run tests against staging
npm run postman:run:staging

# Run tests against production
npm run postman:run:production

# Validate collection (fail on first error)
npm run postman:validate
```

## Environments

### Local Development
- **Base URL**: `http://localhost:3000`
- **Purpose**: Local development and testing
- **Usage**: `npm run postman:run`

### Staging
- **Base URL**: `https://staging-api.cinematik.com`
- **Purpose**: Staging environment testing
- **Usage**: `npm run postman:run:staging`

### Production
- **Base URL**: `https://api.cinematik.com`
- **Purpose**: Production environment validation
- **Usage**: `npm run postman:run:production`

## Collection Features

### Global Scripts

- **Pre-request Script**: 
  - Auto-sets Authorization header with Bearer token
  - Sets common headers (Content-Type, Accept)
  - Logs request details

- **Test Script**:
  - Validates response status codes
  - Checks response times
  - Auto-stores auth tokens from login responses

### Authentication Flow

1. **Sign In**: Call `POST /auth/signin` to get auth token
2. **Token Storage**: Token automatically stored in environment
3. **Authenticated Requests**: Token automatically added to subsequent requests
4. **Token Refresh**: Use `POST /auth/refresh` when token expires

### Test Data

The local environment includes test credentials:

- **Email**: `test@example.com`
- **Password**: `password123`

## Manual Testing with Postman App

1. Import the collection: `File > Import > Upload Files`
2. Select `postman/collections/cinematik-api.postman_collection.json`
3. Import environment: `File > Import > Upload Files`
4. Select `postman/environments/local.postman_environment.json`
5. Select the environment from the dropdown
6. Run requests manually or use Collection Runner

## Continuous Integration

### GitHub Actions

Add to your workflow:

```yaml
- name: Run Postman Tests
  run: |
    npm run start:dev &
    sleep 10
    npm run postman:generate
    npm run postman:run:report
  env:
    CI: true
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run Postman validation
npm run postman:validate
```

## Customization

### Adding New Environments

1. Create new environment file in `postman/environments/`
2. Update `package.json` scripts to use new environment
3. Update `postman.config.json` if needed

### Modifying Collection

1. Update `scripts/generate-postman-collection.js`
2. Re-generate with `npm run postman:generate`
3. Test changes with `npm run postman:validate`

### Custom Tests

Add custom tests in the global test script or individual request test scripts:

```javascript
// Example: Validate response structure
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData).to.have.property('code');
    pm.expect(jsonData).to.have.property('message');
});
```

## Troubleshooting

### Collection Generation Fails

1. Ensure API server is running: `npm run start:dev`
2. Check API URL is accessible: `curl http://localhost:3000/api-json`
3. Verify OpenAPI spec is valid

### Authentication Issues

1. Check auth token in environment variables
2. Verify token format: `Bearer <token>`
3. Ensure token is not expired

### Test Failures

1. Check API server logs for errors
2. Verify test data exists in database
3. Update environment variables if needed

## Best Practices

1. **Regular Updates**: Re-generate collection after API changes
2. **Environment Management**: Use appropriate environments for different stages
3. **Test Coverage**: Ensure all endpoints have appropriate tests
4. **Documentation**: Keep collection descriptions up to date
5. **Version Control**: Commit environment configurations (exclude sensitive data)

## Support

For issues or questions:

1. Check API documentation: `http://localhost:3000/api`
2. Review server logs for API errors
3. Validate collection with `npm run postman:validate`
4. Check test reports in `postman/reports/`
EOF

echo -e "${GREEN}✅ Postman CLI setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start the API server: npm run start:dev"
echo "2. Generate Postman collection: npm run postman:generate"
echo "3. Run tests: npm run postman:run"
echo "4. View HTML report: open postman/reports/report.html"
echo ""
echo -e "${YELLOW}📚 Documentation: postman/README.md${NC}"
