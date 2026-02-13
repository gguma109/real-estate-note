import Sidebar from '../components/Sidebar';
import './globals.css';

export const metadata = {
  title: 'Real Estate Note',
  description: 'Manage your real estate listings like notes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
