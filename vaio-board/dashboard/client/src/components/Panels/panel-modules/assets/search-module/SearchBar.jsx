import React from 'react';
import SearchIcons from './SearchIcons';

const SearchBar = ({ 
  searchTerm, 
  setSearchTerm, 
  showAdvancedSearch, 
  toggleAdvancedSearch,
  searchInputRef 
}) => {
  return (
    <div className="flex items-center p-1 crt-border-inner7 crt-bg-blk rounded mb-1">
      {/* Search icon */}
      <div className="flex-shrink-0 crt-text3 px-2">
        <SearchIcons.Search />
      </div>
      
      {/* Search input */}
      <input
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search logs..."
        className="flex-grow bg-transparent border-none outline-none crt-text4 text-sm px-1"
        style={{ caretColor: '#39ff14' }}
      />
      
      {/* Clear button (only shown when searchTerm is not empty) */}
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="crt-link5 flex-shrink-0 px-2 hover:text-white"
          title="Clear search"
        >
          <SearchIcons.Close />
        </button>
      )}
      
      {/* Advanced search button */}
      <button
        onClick={toggleAdvancedSearch}
        className={`flex-shrink-0 flex items-center px-2 py-1 text-xs rounded ${
          showAdvancedSearch ? 'crt-bg-blk-active crt-text5' : 'crt-text3 hover:crt-text5'
        }`}
        title="Advanced search and filtering"
      >
        <SearchIcons.Filter className="mr-1" />
        <span>Advanced</span>
      </button>
    </div>
  );
};

export default SearchBar;