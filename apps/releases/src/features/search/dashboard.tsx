import ReleaseSearchField from '@/features/search/ReleaseSearchField';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Home hero search — navigates to `/search` with optional query. */
export default function DashboardSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const goToSearch = () => {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <ReleaseSearchField
      value={query}
      onChange={setQuery}
      onSubmit={goToSearch}
      className="mt-6 w-full max-w-4xl"
      placeholder="Search releases… commands, tags, changelog lines"
    />
  );
}
