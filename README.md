# Wick Wax & Relax

A premium e-commerce website for scented candles, wax melts, and bath products with a focus on accessibility and user experience.

## Features

- Fully responsive design
- Accessibility compliant with WCAG 2.1 AA standards
- Modern React-based frontend with Next.js
- Product catalog with categories and search
- Shopping cart and checkout functionality
- User account management
- Accessibility features including:
  - Keyboard navigation
  - Screen reader compatibility
  - High contrast mode support
  - Focus indicators
  - Skip links
  - ARIA landmarks

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wick-wax-relax.git
   cd wick-wax-relax
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   cd frontend && npm install && cd ../backend && npm install
   ```

### Starting the Application

#### Option 1: Using the provided scripts (Recommended)

**For Linux/macOS:**
```bash
chmod +x start-servers.sh
./start-servers.sh
```

**For Windows:**
```cmd
start-servers.bat
```

#### Option 2: Starting servers manually

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run accessibility tests specifically
npm run test:accessibility

# Run tests with coverage
npm run test:coverage
```

### Accessibility Testing

```bash
# Run Lighthouse accessibility audit
npm run lighthouse:accessibility
```

### Code Style

This project uses ESLint for code linting. To check for linting errors:

```bash
npm run lint
```

## Project Structure

```
wick-wax-relax/
├── frontend/                 # React/Next.js frontend
│   ├── components/          # React components
│   ├── pages/              # Next.js pages
│   ├── styles/             # CSS and styling files
│   ├── __tests__/          # Test files
│   └── public/             # Static assets
├── backend/                 # Node.js backend API
│   ├── controllers/        # API controllers
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   └── middleware/         # Custom middleware
├── start-servers.sh         # Script to start both servers (Linux/macOS)
├── start-servers.bat        # Script to start both servers (Windows)
└── README.md               # This file
```

## Accessibility Features

This website has been designed with accessibility in mind and includes:

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Skip Links**: Quick navigation to main content areas
- **High Contrast**: Support for high contrast mode
- **Responsive Design**: Works across all device sizes
- **Alternative Text**: Descriptive alt text for all images

For more information, see our [Accessibility Statement](http://localhost:3000/accessibility).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

When contributing, please ensure that:
- All new features are accessible
- Tests pass for your changes
- Code follows the project's style guidelines

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Email: info@wickwaxrelax.co.uk
- Website: https://www.wickwaxrelax.co.uk
- Accessibility: accessibility@wickwaxrelax.co.uk