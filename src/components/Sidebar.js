"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { Plus, Search, Home, Building2, Building } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings');
      const data = await res.json();
      setListings(data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createNewListing = async () => {
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '새로운 매물',
          type: 'apartment',
          price: '',
          status: 'active'
        }),
      });
      const newListing = await res.json();
      setListings([newListing, ...listings]);
      router.push(`/listing/${newListing.id}`);
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'apartment': return <Building2 size={16} />;
      case 'officetel': return <Building size={16} />;
      default: return <Home size={16} />;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>부동산 노트</h2>
        <button className="new-note-btn" onClick={createNewListing}><Plus size={18} /> 새 매물</button>
      </div>

      <div className="search-bar">
        <Search className="search-icon" size={16} />
        <input
          type="text"
          placeholder="매물 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <nav className="listing-list">
        {filteredListings.map((listing) => (
          <Link key={listing.id} href={`/listing/${listing.id}`} className={`listing-item ${pathname === `/listing/${listing.id}` ? 'active' : ''}`}>
            <div className="listing-title">
              {getIcon(listing.type)}
              <span>{listing.title}</span>
            </div>
            <div className="listing-meta">
              <span className="price">{listing.price || '가격 미정'}</span>
              <span className={`status-badge ${listing.status}`}>{listing.status}</span>
            </div>
          </Link>
        ))}
      </nav>

      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sidebar-header {
          padding: 1.5rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header h2 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .new-note-btn {
          background-color: var(--accent-color);
          color: white;
          padding: 0.5rem 0.8rem;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .new-note-btn:hover {
          background-color: var(--accent-hover);
        }

        .search-bar {
          padding: 1rem;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .search-bar input {
          width: 100%;
          padding: 0.6rem 0.6rem 0.6rem 2.2rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background-color: var(--bg-primary);
          outline: none;
          font-size: 0.9rem;
        }

        .search-bar input:focus {
          border-color: var(--accent-color);
        }

        .listing-list {
          flex: 1;
          overflow-y: auto;
        }

        .listing-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background 0.2s;
        }

        .listing-item:hover {
          background-color: var(--bg-primary);
        }

        .listing-item.active {
          background-color: #e3f2fd;
          border-left: 4px solid var(--accent-color);
        }

        .listing-title {
          font-weight: 500;
          margin-bottom: 0.4rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .listing-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .status-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .status-badge.active { background-color: #d4edda; color: #155724; }
        .status-badge.pending { background-color: #fff3cd; color: #856404; }
        .status-badge.sold { background-color: #f8d7da; color: #721c24; }
      `}</style>
    </aside>
  );
}
