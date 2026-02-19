# 99HomeBazaar Admin Panel

A modern, production-ready admin dashboard for managing the 99HomeBazaar real estate platform. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Dashboard Analytics** - Real-time statistics and insights with beautiful charts
- **Property Management** - Comprehensive property listing management with filtering and pagination
- **User Management** - Manage users, roles, and permissions
- **Inquiry Tracking** - Track and respond to customer inquiries
- **Newsletter Management** - Manage email subscribers with export functionality
- **Authentication** - Secure admin login with JWT tokens
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Modern UI** - Clean, professional interface with smooth animations

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (default: http://localhost:4000/api)

## 🛠️ Installation

1. **Clone or extract the project**
   ```bash
   cd admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
admin-panel/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard page
│   ├── properties/          # Properties management
│   ├── users/              # Users management
│   ├── inquiries/          # Inquiries management
│   ├── newsletter/         # Newsletter subscribers
│   ├── login/              # Login page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home (redirects to dashboard)
├── components/             
│   ├── layout/             # Layout components
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   └── AuthGuard.tsx   # Route protection
│   └── ui/                 # Reusable UI components
│       └── index.tsx       # All UI components
├── lib/
│   ├── api.ts              # API client and endpoints
│   ├── auth-context.tsx    # Authentication context
│   └── utils.ts            # Utility functions
├── types/
│   └── index.ts            # TypeScript type definitions
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🔌 API Integration

The admin panel connects to your backend API using the following endpoints:

### Authentication
- `POST /admin/auth/login` - Admin login
- `GET /admin/auth/me` - Get current admin user

### Dashboard
- `GET /admin/stats` - Get dashboard statistics

### Users
- `GET /admin/users` - List users (with pagination and filters)
- `PATCH /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

### Properties
- `GET /admin/properties` - List properties (with pagination and filters)
- `PATCH /admin/properties/:id` - Update property
- `DELETE /admin/properties/:id` - Delete property

### Inquiries
- `GET /admin/inquiries` - List inquiries (with pagination and filters)
- `PATCH /admin/inquiries/:id/status` - Update inquiry status

### Newsletter
- `GET /admin/newsletter` - List newsletter subscribers (with pagination and filters)

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```js
colors: {
  slate: { ... },  // Main UI colors
  amber: { ... },  // Accent colors
}
```

### Fonts
The admin panel uses:
- **Outfit** for headings (display font)
- **DM Sans** for body text

These are loaded from Google Fonts in `app/globals.css`.

### Logo and Branding
Update the logo and brand name in:
- `components/layout/Sidebar.tsx` - Sidebar branding
- `app/login/page.tsx` - Login page branding

## 🔒 Security

- All API requests include JWT token in Authorization header
- Auto-redirect to login on 401 responses
- Protected routes with AuthGuard component
- Tokens stored in localStorage (consider httpOnly cookies for production)

## 📱 Responsive Design

The admin panel is fully responsive with:
- Desktop: Full sidebar navigation
- Tablet: Optimized grid layouts
- Mobile: Stacked layouts with touch-friendly controls

## 🚀 Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Dashboard Features

### Analytics
- Total users, properties, inquiries, and subscribers
- Weekly activity charts (views, inquiries, signups)
- User distribution pie chart
- Property statistics bar chart
- Recent users and properties lists

### Property Management
- View all properties with pagination
- Filter by status (active, pending, sold, rented, archived)
- Filter by listing type (sale, rent)
- Search properties
- Update property status
- Delete properties
- View property details (images, specs, engagement metrics)

### User Management
- View all users in grid layout
- Filter by role (buyer, seller, agent, admin)
- Search users by name or email
- Update user roles
- Delete users
- View user verification status

### Inquiry Management
- View all inquiries with property context
- Filter by status (new, read, replied, closed)
- Search inquiries
- View full inquiry details in modal
- Update inquiry status
- See sender information (registered user or guest)

### Newsletter Management
- View all subscribers in table format
- Active/inactive status tracking
- Search subscribers by email
- Export subscribers to CSV
- Statistics cards for active, unsubscribed, and total counts

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **date-fns** - Date formatting

## 📝 Notes

- Default API URL is `http://localhost:4000/api` (configurable via env)
- All dates are formatted using date-fns library
- Currency formatting uses INR (Indian Rupee)
- Pagination defaults to 10-15 items per page depending on the section

## 🤝 Support

For issues or questions:
1. Check the API endpoint configurations in `lib/api.ts`
2. Verify environment variables in `.env.local`
3. Check browser console for detailed error messages

## 📄 License

© 2026 99HomeBazaar. All rights reserved.
