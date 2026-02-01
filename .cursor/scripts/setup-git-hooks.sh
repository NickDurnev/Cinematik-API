#!/bin/bash

# Git Hooks Setup Script for Cinematik API
# This script sets up git hooks for better code quality and consistency

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🪝 Setting up Git Hooks for Cinematik API${NC}"

# Check if .husky directory exists
if [ ! -d ".husky" ]; then
    echo -e "${YELLOW}🔧 Initializing Husky...${NC}"
    npx husky init
    
    # Update package.json prepare script
    npm pkg set scripts.prepare="husky"
fi

# Create pre-commit hook
echo -e "${YELLOW}📝 Creating pre-commit hook...${NC}"
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run linting and formatting
echo "📝 Running Biome linting..."
npm run lint:fix

echo "🎨 Running Biome formatting..."
npm run format:fix

# Run TypeScript compilation check
echo "📦 Running TypeScript compilation check..."
npx tsc --noEmit

# Run tests in watch mode with coverage
echo "🧪 Running unit tests..."
npm test -- --watchAll=false --coverage --passWithNoTests

# Check for console.log statements in production code
echo "🚫 Checking for console.log statements..."
if git diff --cached --name-only | xargs grep -l "console\.log" 2>/dev/null; then
    echo "❌ Please remove console.log statements before committing"
    exit 1
fi

# Check for TODO comments without issue references
echo "📋 Checking for TODO comments..."
if git diff --cached --name-only | xargs grep -n "TODO\|FIXME" 2>/dev/null | grep -v "# TODO.*#\|TODO:.*[0-9]\|FIXME.*[0-9]"; then
    echo "⚠️  Please add issue references to TODO/FIXME comments"
    echo "   Example: TODO: Add validation #123"
    echo "   Or ignore with: TODO: Temporary #ignore"
fi

echo "✅ Pre-commit checks passed!"
EOF

# Make pre-commit hook executable
chmod +x .husky/pre-commit

# Create pre-push hook
echo -e "${YELLOW}📝 Creating pre-push hook...${NC}"
cat > .husky/pre-push << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# Run full test suite
echo "🧪 Running full test suite..."
npm run test:cov

# Run E2E tests if they exist
if [ -f "test/jest-e2e.json" ]; then
    echo "🎭 Running E2E tests..."
    npm run test:e2e
fi

# Build the application
echo "📦 Building application..."
npm run build

echo "✅ Pre-push checks passed!"
EOF

# Make pre-push hook executable
chmod +x .husky/pre-push

# Create commit-msg hook
echo -e "${YELLOW}📝 Creating commit-msg hook...${NC}"
cat > .husky/commit-msg << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run commitlint to validate commit message
npx --no -- commitlint --edit $1
EOF

# Make commit-msg hook executable
chmod +x .husky/commit-msg

# Create post-checkout hook for dependency management
echo -e "${YELLOW}📝 Creating post-checkout hook...${NC}"
cat > .husky/post-checkout << 'EOF'
#!/bin/sh

# Check if package.json changed
if git diff --name-only $1 $2 | grep -q "package\.json"; then
    echo "📦 package.json has changed, running npm install..."
    npm install
fi
EOF

# Make post-checkout hook executable
chmod +x .husky/post-checkout

# Create post-merge hook for dependency management
echo -e "${YELLOW}📝 Creating post-merge hook...${NC}"
cat > .husky/post-merge << 'EOF'
#!/bin/sh

# Check if package.json changed in the merge
if git diff HEAD@{1} HEAD --name-only | grep -q "package\.json"; then
    echo "📦 package.json has changed, running npm install..."
    npm install
fi
EOF

# Make post-merge hook executable
chmod +x .husky/post-merge

# Create additional utility scripts
echo -e "${YELLOW}📝 Creating utility scripts...${NC}"

# Create script to skip hooks (for emergency use)
cat > scripts/skip-hooks.sh << 'EOF'
#!/bin/bash

# Emergency script to skip git hooks
# WARNING: Use only when absolutely necessary

echo "⚠️  WARNING: Skipping git hooks!"
echo "This should only be used in emergency situations."

read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit --no-verify "$@"
else
    echo "Operation cancelled."
    exit 1
fi
EOF

chmod +x scripts/skip-hooks.sh

# Create script to run all quality checks
cat > scripts/quality-check.sh << 'EOF'
#!/bin/bash

# Run all quality checks locally

set -e

echo "🔍 Running full quality check suite..."

echo "📝 Linting..."
npm run lint:fix

echo "🎨 Formatting..."
npm run format:fix

echo "📦 Type checking..."
npx tsc --noEmit

echo "🧪 Unit tests..."
npm test

echo "🎭 E2E tests..."
if [ -f "test/jest-e2e.json" ]; then
    npm run test:e2e
fi

echo "📦 Build check..."
npm run build

echo "🚫 Checking for console.log..."
if find src -name "*.ts" -not -path "*/node_modules/*" -exec grep -l "console\.log" {} \; 2>/dev/null; then
    echo "❌ Found console.log statements. Please remove them."
    exit 1
fi

echo "✅ All quality checks passed!"
EOF

chmod +x scripts/quality-check.sh

# Create script to check commit message format
cat > scripts/check-commit.sh << 'EOF'
#!/bin/bash

# Check commit message format before commit

commit_message_file="$1"
commit_message=$(cat "$commit_message_file")

# Define the conventional commit pattern
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,50}"

if [[ ! $commit_message =~ $pattern ]]; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Please use the conventional commit format:"
    echo "  <type>(<scope>): <description>"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
    echo "Example: feat(auth): add JWT token refresh"
    echo "Example: fix(api): resolve user registration bug"
    echo "Example: docs(readme): update installation guide"
    echo ""
    echo "Learn more: https://www.conventionalcommits.org/"
    exit 1
fi

# Check for proper description length
description=$(echo "$commit_message" | sed -E 's/^(.+): //')
if [[ ${#description} -lt 10 ]]; then
    echo "❌ Description too short! Please provide at least 10 characters."
    exit 1
fi

# Check for proper capitalization
first_char=${description:0:1}
if [[ ! $first_char =~ [A-Z] ]]; then
    echo "❌ Description should start with a capital letter."
    exit 1
fi

# Check that it doesn't end with a period
if [[ $description =~ \.$ ]]; then
    echo "❌ Description should not end with a period."
    exit 1
fi

echo "✅ Commit message format is valid!"
EOF

chmod +x scripts/check-commit.sh

# Update commitlint configuration if it doesn't exist
if [ ! -f ".commitlintrc.json" ] && [ ! -f "commitlint.config.js" ]; then
    echo -e "${YELLOW}📝 Creating commitlint configuration...${NC}"
    cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that do not affect the meaning of the code
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'perf',     // A code change that improves performance
        'test',     // Adding missing tests or correcting existing tests
        'build',    // Changes that affect the build system or external dependencies
        'ci',       // Changes to our CI configuration files and scripts
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'max-line-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
};
EOF
fi

# Create or update lint-staged configuration
echo -e "${YELLOW}📝 Updating lint-staged configuration...${NC}"
cat > .lintstagedrc.json << 'EOF'
{
  "*.{js,jsx,ts,tsx}": [
    "biome lint --write",
    "biome format --write",
    "git add"
  ],
  "*.{json,md,yml,yaml}": [
    "biome format --write",
    "git add"
  ]
}
EOF

# Update package.json scripts if they don't exist
echo -e "${YELLOW}📝 Updating package.json scripts...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = pkg.scripts || {};

// Add quality check scripts if they don't exist
if (!pkg.scripts['quality:check']) {
    pkg.scripts['quality:check'] = 'bash scripts/quality-check.sh';
}

if (!pkg.scripts['commit:check']) {
    pkg.scripts['commit:check'] = 'bash scripts/check-commit.sh';
}

if (!pkg.scripts['hooks:skip']) {
    pkg.scripts['hooks:skip'] = 'bash scripts/skip-hooks.sh';
}

// Update lint-staged configuration
pkg['lint-staged'] = {
  '*.{js,jsx,ts,tsx}': [
    'biome lint --write',
    'biome format --write'
  ],
  '*.{json,md,yml,yaml}': [
    'biome format --write'
  ]
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Create Git configuration recommendations
echo -e "${YELLOW}📝 Creating Git configuration recommendations...${NC}"
cat > .gitconfig-recommendations << 'EOF'
# Git Configuration Recommendations for Cinematik API
# Add these to your global ~/.gitconfig or local .git/config file

[user]
    name = Your Name
    email = your.email@example.com

[core]
    autocrlf = input
    editor = nano
    whitespace = trailing-space,space-before-tab

[push]
    default = simple

[pull]
    rebase = true

[init]
    defaultBranch = main

[alias]
    # Quality aliases
    q = "!bash scripts/quality-check.sh"
    qc = "!bash scripts/quality-check.sh"
    
    # Commit with quality check
    cc = "!bash scripts/check-commit.sh && git commit"
    
    # Skip hooks (emergency only)
    skip = "!bash scripts/skip-hooks.sh"
    
    # Branch management
    branches = branch -a
    tags = tag -l
    
    # Status improvements
    s = status -sb
    ss = status --ignored
    
    # Log improvements
    l = log --oneline --graph --decorate -10
    ll = log --oneline --graph --decorate -20
    lg = log --oneline --graph --decorate --all
    
    # Diff improvements
    d = diff
    ds = diff --staged
    dt = difftool
    
    # Stash management
    sl = stash list
    sa = stash apply
    sp = stash pop
    
    # Clean up
    cleanup = "!git branch --merged | grep -v '\\*\\|main\\|dev' | xargs -n 1 git branch -d"
    
    # Search commits
    search = "!f() { git log --all --grep=\"$1\" --oneline; }; f"
    
    # Show file history
    blame-pr = "!f() { git log --pretty=format:'%h - %an, %ar : %s' -- $1; }; f"

[merge]
    tool = vscode

[diff]
    tool = vscode

[mergetool "vscode"]
    cmd = code --wait $MERGED

[rebase]
    autoStash = true

[status]
    showUntrackedFiles = all
EOF

echo -e "${GREEN}✅ Git hooks setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}🪝 Created hooks:${NC}"
echo "  - pre-commit: Linting, formatting, type checking, tests"
echo "  - pre-push: Full test suite and build"
echo "  - commit-msg: Commit message validation"
echo "  - post-checkout: Dependency management"
echo "  - post-merge: Dependency management"
echo ""
echo -e "${YELLOW}🛠️  Utility scripts:${NC}"
echo "  - scripts/quality-check.sh - Run all quality checks"
echo "  - scripts/check-commit.sh - Validate commit message"
echo "  - scripts/skip-hooks.sh - Emergency hook bypass"
echo ""
echo -e "${YELLOW}⚙️  Configuration files:${NC}"
echo "  - .lintstagedrc.json - Lint-staged configuration"
echo "  - commitlint.config.js - Commit message rules"
echo "  - .gitconfig-recommendations - Git config suggestions"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Review and customize the hooks as needed"
echo "2. Check .gitconfig-recommendations for Git configuration tips"
echo "3. Test the hooks by making a test commit"
echo "4. Run 'npm run quality:check' to verify all checks work"
echo ""
echo -e "${GREEN}🎉 Your code quality is now automated!${NC}"
