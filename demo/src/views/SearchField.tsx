import React, { FC, useState, useEffect, ChangeEvent } from "react";
import { useSigma } from "react-sigma-v2";
import { FiltersState } from "../types";

interface SearchFieldProps {
  filters: FiltersState;
  setSelectedNode: (node: string | null) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const SearchField: FC<SearchFieldProps> = ({ filters, setSelectedNode, placeholder = "Search...", style = {} }) => {
  const sigma = useSigma();
  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    // ... existing search logic
  }, [search, sigma, filters]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
  };

  const handleSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    setSearch("");
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleChange}
        style={{ width: '100%', padding: '5px' }}
      />
      {results.length > 0 && (
        <ul style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          backgroundColor: 'white', 
          listStyle: 'none', 
          margin: 0, 
          padding: 0, 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          {results.map((result) => (
            <li 
              key={result.id} 
              onClick={() => handleSelect(result.id)}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              {result.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchField;
