# Contributing to TEC LMS

Thank you for your interest in contributing to the TEC Learning Management System!

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, browser, Node version)

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Mockups or examples if possible
   - Which phase it belongs to

### Code Contributions

#### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/tec-lms.git
cd tec-lms

# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cp .env.local.example .env.local

# Start development server
npm run dev
```

#### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

#### Making Changes

1. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Follow the code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
```bash
npm run build
npm run lint
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add your feature description"
```

5. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request**
   - Provide a clear description
   - Reference related issues
   - Add screenshots if UI changes
   - Request review from maintainers

## 📝 Code Style Guidelines

### TypeScript

```typescript
// Use explicit types
function getUserById(id: string): Promise<User> {
  // implementation
}

// Use interfaces for objects
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

// Use enums for constants
enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}
```

### React Components

```typescript
// Use functional components with TypeScript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {children}
    </button>
  );
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Pages: `page.tsx` (Next.js convention)
- Types: `camelCase.types.ts` (e.g., `database.types.ts`)

### CSS/Tailwind

```typescript
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// Use the cn() utility for conditional classes
<button className={cn(
  'px-4 py-2 rounded-lg',
  isPrimary ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
)}>
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Works in different browsers
- [ ] No TypeScript errors
- [ ] Follows accessibility guidelines

### Writing Tests (Future)

```typescript
// Unit test example
describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('January 1, 2024');
  });
});

// Component test example
describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📚 Documentation

### Code Comments

```typescript
/**
 * Calculates the GPA from an array of grades
 * @param grades - Array of numeric grades (0-100)
 * @returns Calculated GPA rounded to 2 decimal places
 */
export function calculateGPA(grades: number[]): number {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  return Math.round((sum / grades.length) * 100) / 100;
}
```

### README Updates

When adding features, update:
- Feature list
- Setup instructions (if needed)
- API documentation (if applicable)
- Screenshots (if UI changes)

## 🔒 Security Guidelines

### Never Commit

- ❌ API keys or secrets
- ❌ `.env.local` file
- ❌ Database credentials
- ❌ Personal information
- ❌ `node_modules/`

### Always

- ✅ Use environment variables
- ✅ Validate user input
- ✅ Sanitize data before database queries
- ✅ Use Supabase RLS policies
- ✅ Follow OWASP guidelines

## 🎯 Phase-Specific Guidelines

### Phase 2: Student Information System
- Focus on student data management
- Ensure data privacy
- Add proper validation
- Update database types

### Phase 3: Course Management
- Scalable course structure
- Efficient file handling
- Search and filter functionality
- Proper authorization

### Phase 4: Assessment & Grading
- Secure assessment data
- Accurate grading logic
- Performance optimization
- Real-time updates

## 📋 Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Testing
- [ ] Tested locally
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Cross-browser tested

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

## 🏅 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## 📞 Questions?

- Create a discussion on GitHub
- Contact the maintainers
- Check existing documentation

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

Thank you for contributing to TEC LMS! 🎓
