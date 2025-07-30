# Kedy CLI 🚀

React Native project automation CLI - Create screens, components, analyze projects, fix imports, find unused files and more!

## 📦 Installation

```bash
npm install -g kedy
```

Or use with npx:

```bash
npx kedy <command>
```

## 🎯 Features

### 🏗️ Project Setup

- **`kedy init:config`** - Initialize project configuration and templates

### 📱 Screen & Component Management

- **`kedy make:screen <name>`** - Create a new screen with proper folder structure
- **`kedy make:component <name>`** - Create a new component with proper folder structure
- **`kedy delete:screen <name>`** - Delete a screen and its files
- **`kedy delete:component <name>`** - Delete a component and its files

### 🔍 Code Analysis

- **`kedy analyze:project`** - Comprehensive project analysis
- **`kedy find:unused`** - Find unused files in your project
- **`kedy fix:imports`** - Find and fix unused imports

## 🚀 Quick Start

### 1. Initialize Configuration

```bash
kedy init:config
```

This creates `kedy.config.js` and template files in your project root.

### 2. Create Screens

```bash
# Simple screen
kedy make:screen Home

# Nested screen (both syntaxes work)
kedy make:screen main:dashboard
kedy make:screen "main:dashboard"
```

### 3. Create Components

```bash
# Simple component
kedy make:component Button

# Nested component (both syntaxes work)
kedy make:component ui/Modal
kedy make:component "ui:Modal"
```

### 4. Analyze Your Project

```bash
# Full analysis
kedy analyze:project --all

# Generate HTML report
kedy analyze:project --all --html

# Generate JSON report
kedy analyze:project --all --json
```

## 📋 Commands

### `kedy init:config`

Initialize project configuration and create template files.

### `kedy make:screen <name>`

Create a new screen with the following structure:

```
src/screens/
├── Home/
│   ├── HomeScreen.jsx
│   ├── Home.Styles.js
│   └── index.js
```

**Options:**

- Use `folder:name` or `folder/name` syntax for nested folders (e.g., `main:dashboard` or `main/dashboard`)

### `kedy make:component <name>`

Create a new component with the following structure:

```
src/components/
├── Button/
│   ├── Button.jsx
│   ├── Button.Styles.js
│   └── index.js
```

**Options:**

- Use `folder:name` or `folder/name` syntax for nested folders (e.g., `ui:Modal` or `ui/Modal`)

### `kedy delete:screen <name>`

Delete a screen and all its associated files.

**Options:**

- `--backup` - Create backup before deletion
- `--pattern` - Use pattern matching (e.g., `"Test*"`)

### `kedy delete:component <name>`

Delete a component and all its associated files.

**Options:**

- `--backup` - Create backup before deletion
- `--pattern` - Use pattern matching (e.g., `"Test*"`)

### `kedy find:unused`

Find unused files in your project.

**Options:**

- `--delete` - Delete unused files automatically

### `kedy fix:imports`

Find and fix unused imports in your project.

**Options:**

- `--auto-fix` - Automatically remove unused imports

### `kedy analyze:project`

Comprehensive project analysis including:

- Project overview and file distribution
- Code quality metrics
- Architecture analysis
- Testing analysis
- Security analysis

**Options:**

- `--all` - Run all analysis types
- `--detailed` - Show detailed information
- `--html` - Generate HTML report
- `--json` - Generate JSON report
- `--architecture` - Architecture analysis only
- `--testing` - Testing analysis only
- `--security` - Security analysis only

## ⚙️ Configuration

The `kedy.config.js` file allows you to customize:

```javascript
module.exports = {
  paths: {
    screens: "src/screens",
    components: "src/components",
  },
  defaults: {
    withStyle: true,
    withIndex: true,
    withTest: false,
    withStory: false,
  },
  namingConvention: {
    component: (name) => `${name}`,
    screen: (name) => `${name}Screen`,
    style: (name) => `${name}.Styles`,
    test: (name) => `${name}.test`,
    story: (name) => `${name}.stories`,
  },
  templates: {
    component: "kedy-templates/component.template",
    screen: "kedy-templates/screen.template",
    style: "kedy-templates/style.template",
    test: "kedy-templates/test.template",
    story: "kedy-templates/story.template",
  },
  importAnalysis: {
    fileExtensions: [".tsx", ".ts", ".jsx", ".js"],
    scanFolders: ["src"],
    autoFix: false,
    detailedReport: true,
    excludeFiles: ["node_modules", "dist", "build"],
  },
};
```

## 📁 Project Structure

Kedy CLI creates and maintains the following structure:

```
src/
├── screens/
│   ├── Home/
│   │   ├── HomeScreen.jsx
│   │   ├── Home.Styles.js
│   │   └── index.js
│   └── Main/
│       └── Dashboard/
│           ├── DashboardScreen.jsx
│           ├── Dashboard.Styles.js
│           └── index.js
├── components/
│   ├── Button/
│   │   ├── Button.jsx
│   │   ├── Button.Styles.js
│   │   └── index.js
│   └── Ui/
│       └── Modal/
│           ├── Modal.jsx
│           ├── Modal.Styles.js
│           └── index.js
├── hooks/
└── utils/
```

## 🎨 Templates

Kedy CLI uses customizable templates. You can modify the template files in the `kedy-templates/` folder:

- `component.template` - Component template
- `screen.template` - Screen template
- `style.template` - Style file template
- `test.template` - Test file template
- `story.template` - Storybook template

## 🔧 Requirements

- Node.js >= 14.0.0
- React Native project

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- GitHub Issues: [https://github.com/ahmetcangurel/kedy/issues](https://github.com/ahmetcangurel/kedy/issues)
- Author: Can Gürel <cangureliletisim@gmail.com>

## 🚀 Roadmap

- [ ] Move/Rename commands
- [ ] Batch operations
- [ ] Test generation
- [ ] Storybook integration
- [ ] Performance analysis (v2.0)
- [ ] React Native specific analysis (v2.0)

---

Made with ❤️ by [Can Gürel](https://github.com/ahmetcangurel)
